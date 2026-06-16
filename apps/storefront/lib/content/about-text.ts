/** Tekst sekcji O nas — jeden blok z zachowanymi Enterami z CMS. */
export function flattenAboutBodyParagraphs(paragraphs: string[] | undefined): string {
	if (!paragraphs?.length) return "";

	if (paragraphs.length === 1) {
		const [single] = paragraphs;
		return normalizeAboutBodyLineBreaks(single ?? "");
	}

	// Starszy format (wiele akapitów) → pojedyncze linie jak w textarea.
	return normalizeAboutBodyLineBreaks(
		paragraphs
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
			.join("\n"),
	);
}

function normalizeAboutBodyLineBreaks(text: string): string {
	return text
		.replace(/\r\n/g, "\n")
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n");
}

/** Zapis CMS — zawsze jeden element tablicy z `\n`. */
export function normalizeAboutParagraphsForSave(
	paragraphs: string[] | undefined,
): string[] | undefined {
	if (!paragraphs?.length) return undefined;

	const text = flattenAboutBodyParagraphs(paragraphs);
	return text.length > 0 ? [text] : undefined;
}
