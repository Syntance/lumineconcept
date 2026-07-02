#!/usr/bin/env node
// Cursor preToolUse hook: forces the agent to use graphify before raw code
// exploration (Read/Grep/Glob/Shell-grep), to cut context-reading cost across
// all models (Opus, Fable, Sonnet, etc). Mirrors the Claude Code hook that
// `graphify claude install` writes to .claude/settings.json.

const fs = require("fs");
const path = require("path");

const CODE_EXT = new Set([
  ".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".astro", ".vue", ".svelte", ".go", ".rs", ".java", ".rb",
  ".c", ".h", ".cpp", ".hpp", ".cc", ".cs", ".kt", ".swift",
  ".php", ".scala", ".lua", ".sh", ".ps1", ".md", ".mdx", ".rst", ".txt",
]);

const GREP_LIKE = /\b(grep|rg|ripgrep|find|fd|ack|ag)\b/i;

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

function allow(extra) {
  process.stdout.write(JSON.stringify(extra ? extra : { permission: "allow" }));
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

const MSG =
  "MANDATORY: graphify-out/graph.json exists in this project. Before reading or " +
  "grepping source files, run `graphify query \"<question>\"`, `graphify path " +
  "\"<A>\" \"<B>\"`, or `graphify explain \"<concept>\"` first. Only use " +
  "Read/Grep/Glob/Shell directly once graphify has oriented you, or to edit/debug " +
  "specific lines already located. This applies to every subagent too — include " +
  "this instruction in subagent prompts that involve code exploration.";

function inject() {
  allow({
    permission: "allow",
    agent_message: MSG,
  });
}

if (toolName === "Shell") {
  const cmd = String(toolInput.command || "");
  if (GREP_LIKE.test(cmd) && !/graphify/i.test(cmd)) {
    inject();
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

  // Grep/Glob calls often have no literal extension in the path/glob (e.g. a
  // directory or "**/*"), so default to warning unless it's clearly non-code.
  if (touchesCode || toolName === "Grep" || toolName === "Glob") {
    inject();
  } else {
    allow();
  }
}

allow();
