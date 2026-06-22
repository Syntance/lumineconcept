import { slugify } from "@magazyn/core/lib/slug";

/** Handle z duplikatu (`…-kopia`, `produkt-kopia-…`) — po zmianie nazwy trzeba zsynchronizować URL. */
export function isDuplicateProductHandle(handle: string): boolean {
	return /(?:^|-)kopia(?:-|$)/.test(handle);
}

/**
 * Nowy produkt / szkic: slug z tytułu.
 * Opublikowany: stabilny handle (SEO), chyba że to wciąż „kopia” z duplikatu.
 */
export function resolveProductHandleForSave(input: {
	id?: string;
	title: string;
	handle?: string;
	status: "draft" | "published";
}): string {
	const fromTitle = slugify(input.title.trim());
	if (!input.id) return fromTitle;

	const existing = input.handle?.trim() ?? "";
	if (!existing) return fromTitle;

	if (input.status === "draft" || isDuplicateProductHandle(existing)) {
		return fromTitle;
	}

	return existing;
}
