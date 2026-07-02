#!/usr/bin/env node
// Cursor preToolUse hook: nudges the agent toward graphify before raw code
// exploration (Read/Grep/Glob/Shell-grep), to cut context-reading cost across
// all models (Opus, Fable, Sonnet, etc). Mirrors the Claude Code hook that
// `graphify claude install` writes to .claude/settings.json, but adds a
// debounce so the reminder fires once per "cold" stretch instead of on every
// single tool call — repeating it every time would add token cost, not cut it.

const fs = require("fs");
const path = require("path");

const CODE_EXT = new Set([
  ".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".astro", ".vue", ".svelte", ".go", ".rs", ".java", ".rb",
  ".c", ".h", ".cpp", ".hpp", ".cc", ".cs", ".kt", ".swift",
  ".php", ".scala", ".lua", ".sh", ".ps1", ".md", ".mdx", ".rst", ".txt",
]);

const GREP_LIKE = /\b(grep|rg|ripgrep|find|fd|ack|ag)\b/i;
const STATE_PATH = path.join(process.cwd(), ".cursor", "hooks", ".graphify-guard-state.json");
// After a graphify call, allow this many raw exploration calls before
// nagging again — covers "graphify oriented me, now I read the 3 files it
// pointed at" without re-injecting the reminder on each of those reads.
const GRACE_CALLS = 6;
// If graphify hasn't been touched in this long, treat the grace window as
// expired even if the call counter hasn't been exhausted (long idle/new task).
const GRACE_MS = 20 * 60 * 1000;

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function graphExists() {
  return fs.existsSync(path.join(process.cwd(), "graphify-out", "graph.json"));
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { lastGraphifyAt: 0, callsSinceGraphify: GRACE_CALLS + 1 };
  }
}

function saveState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state));
  } catch {
    // best-effort; never block the tool call on state I/O
  }
}

function allow(extra) {
  process.stdout.write(JSON.stringify(extra || { permission: "allow" }));
  process.exit(0);
}

let input;
try {
  input = JSON.parse(readStdin() || "{}");
} catch {
  allow();
}

if (!graphExists()) {
  allow();
}

const toolName = input.tool_name || input.tool || "";
const toolInput = input.tool_input || input.toolInput || input || {};
const state = loadState();

const MSG =
  "MANDATORY: graphify-out/graph.json exists in this project. Before reading or " +
  "grepping source files, run `graphify query \"<question>\"`, `graphify path " +
  "\"<A>\" \"<B>\"`, or `graphify explain \"<concept>\"` first. Only use " +
  "Read/Grep/Glob/Shell directly once graphify has oriented you, or to edit/debug " +
  "specific lines already located. This applies to every subagent too — include " +
  "this instruction in subagent prompts that involve code exploration.";

function withinGrace() {
  const idleMs = Date.now() - state.lastGraphifyAt;
  return state.callsSinceGraphify < GRACE_CALLS && idleMs < GRACE_MS;
}

function markGraphifyUsed() {
  saveState({ lastGraphifyAt: Date.now(), callsSinceGraphify: 0 });
  allow();
}

function maybeInject() {
  if (withinGrace()) {
    saveState({ ...state, callsSinceGraphify: state.callsSinceGraphify + 1 });
    allow();
  }
  saveState({ ...state, callsSinceGraphify: state.callsSinceGraphify + 1 });
  allow({ permission: "allow", agent_message: MSG });
}

if (toolName === "Shell") {
  const cmd = String(toolInput.command || "");
  if (/\bgraphify\b/i.test(cmd)) {
    markGraphifyUsed();
  }
  // Cheap, targeted single-string lookups (files_with_matches-style greps)
  // are often fine on their own — only nag for open-ended greps across the
  // whole tree, which is where graphify actually saves tokens.
  const isBroadGrep = GREP_LIKE.test(cmd) && !/\bgraphify\b/i.test(cmd);
  if (isBroadGrep) {
    maybeInject();
  }
  allow();
}

if (toolName === "Read" || toolName === "Glob" || toolName === "Grep") {
  const candidates = [
    toolInput.path,
    toolInput.target_directory,
    toolInput.glob_pattern,
  ].filter(Boolean).map(String);

  const touchesGraphifyOut = candidates.some((v) =>
    v.replace(/\\/g, "/").includes("graphify-out/")
  );
  if (touchesGraphifyOut) allow();

  const touchesCode = candidates.some((v) => {
    const ext = path.extname(v.replace(/\\/g, "/").split("/").pop() || "");
    return CODE_EXT.has(ext.toLowerCase());
  });

  // A single-file Read with a known path is a targeted, already-cheap
  // operation (often the result of a prior graphify call) — don't nag on
  // those. Glob/broad Grep without a specific literal target are the
  // expensive fishing expeditions graphify is meant to replace.
  const isTargetedSingleRead = toolName === "Read" && candidates.length === 1;

  if ((touchesCode || toolName === "Grep" || toolName === "Glob") && !isTargetedSingleRead) {
    maybeInject();
  } else {
    allow();
  }
}

allow();
