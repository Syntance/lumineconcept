import sanitizeHtml from "sanitize-html";
import { stripHtmlForDimensions } from "@/lib/products/dimensions";

/**
 * Używamy `sanitize-html` (czysty htmlparser2, bez jsdom) zamiast
 * `isomorphic-dompurify`, bo ten ostatni na Vercelu/Next 16 z Turbopackiem
 * próbuje załadować ESM-only `@exodus/bytes/encoding-lite.js` przez
 * synchroniczny `require()` jsdomu i wywala 500 (ERR_REQUIRE_ESM).
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "span", "div"],
  allowedAttributes: {},
  /** Zachowujemy lekkie znaki diakrytyczne — nie chcemy escape encji UTF-8. */
  disallowedTagsMode: "discard",
  allowedSchemes: [],
  allowedSchemesByTag: {},
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Ile zamknięć </p> — surowe liczenie po sanityzacji. */
function closedParagraphCount(html: string): number {
  return (html.match(/<\/p>/gi) ?? []).length;
}

/**
 * Dzieli płaski tekst (z zachowanymi \n z <br>/akapitów) na segmenty:
 * wiersze z edytora albo jedna linia → intro + „Wymiary:” + „Materiał:”.
 */
function splitPlainIntoSegments(plain: string): string[] {
  const normalized = plain.trim();
  if (!normalized) return [];

  const byNewline = normalized
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (byNewline.length > 1) return byNewline;

  const single = byNewline[0] ?? normalized;
  const wIdx = single.search(/Wymiary\s*:/i);
  const mMateriał = single.search(/Materiał\s*:/i);
  const mMaterial = single.search(/Material\s*:/i);
  const mIdx =
    mMateriał >= 0 && mMaterial >= 0
      ? Math.min(mMateriał, mMaterial)
      : Math.max(mMateriał, mMaterial);
  if (wIdx < 0 && mIdx < 0) return [single];

  const rawPoints = [0, wIdx, mIdx, single.length].filter(
    (i) => i >= 0 && i <= single.length,
  );
  const points = [...new Set(rawPoints)].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const chunk = single.slice(points[i]!, points[i + 1]!).trim();
    if (chunk) out.push(chunk);
  }
  return out.length > 0 ? out : [single];
}

function segmentToParagraphHtml(line: string): string {
  const w = line.match(/^Wymiary\s*:\s*(.*)$/i);
  if (w) {
    const rest = (w[1] ?? "").trim();
    return `<p><strong>Wymiary:</strong> ${escapeHtml(rest)}</p>`;
  }
  const mPl = line.match(/^Materiał\s*:\s*(.*)$/i);
  if (mPl) {
    const rest = (mPl[1] ?? "").trim();
    return `<p><strong>Materiał:</strong> ${escapeHtml(rest)}</p>`;
  }
  const mEn = line.match(/^Material\s*:\s*(.*)$/i);
  if (mEn) {
    const rest = (mEn[1] ?? "").trim();
    return `<p><strong>Materiał:</strong> ${escapeHtml(rest)}</p>`;
  }
  return `<p>${escapeHtml(line.trim())}</p>`;
}

/**
 * Układ jak na kafelku: osobne akapity, etykiety Wymiary/Materiał w <strong>.
 * Gdy CMS już dał ≥2 akapity — zostawiamy HTML; inaczej układamy tekst z opisu.
 */
function formatProductCardDescriptionStructure(sanitized: string): string {
  const pClose = closedParagraphCount(sanitized);
  if (pClose >= 2) {
    return sanitized;
  }

  const plain = stripHtmlForDimensions(sanitized);
  const segments = splitPlainIntoSegments(plain);
  const shouldRebuild = segments.length > 1;

  if (!shouldRebuild) {
    return sanitized;
  }

  const html = segments.map(segmentToParagraphHtml).join("");
  return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
}

/** Bezpieczny podzbiór HTML z Medusy pod kartę produktu (strong, akapity, łamania linii). */
export function sanitizeProductCardDescriptionHtml(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const clean = sanitizeHtml(raw.trim(), SANITIZE_OPTIONS);
  const trimmed = clean.trim();
  if (trimmed.length === 0) return null;
  const structured = formatProductCardDescriptionStructure(trimmed);
  return structured.length > 0 ? structured : null;
}
