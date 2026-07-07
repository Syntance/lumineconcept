import sanitizeHtml from "sanitize-html";

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a"],
	allowedAttributes: {
		a: ["href", "title", "rel", "target"],
	},
	allowedSchemes: ["https", "http", "mailto"],
};

/** Sanityzacja rich-text w propsach sekcji przed zapisem (bez isomorphic-dompurify). */
export function sanitizeRichTextHtml(html: string): string {
	return sanitizeHtml(html.trim(), RICH_TEXT_OPTIONS).trim();
}

export function sanitizePlainText(text: string): string {
	return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}
