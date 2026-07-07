import { sanitizePlainText, sanitizeRichTextHtml } from "./sections/sanitize";

export type InlineEditMode = "text" | "html";

/**
 * Normalizuje wartość z contentEditable przed zapisem do props sekcji.
 */
export function parseInlineEditValue(raw: string, mode: InlineEditMode = "text"): string {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	return mode === "html" ? sanitizeRichTextHtml(trimmed) : sanitizePlainText(trimmed);
}
