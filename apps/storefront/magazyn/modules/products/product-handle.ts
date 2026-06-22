import { slugify } from "@magazyn/core/lib/slug";

const COPY_TITLE_SUFFIX = /\s*\(kopia\)\s*$/i;

/** Usuwa sufiks „(kopia)” z nazwy — slug nie powinien go zawierać po zmianie tytułu. */
export function stripCopySuffixFromTitle(title: string): string {
	return title.trim().replace(COPY_TITLE_SUFFIX, "").trim();
}

/** Handle z duplikatu (`…-kopia`, `produkt-kopia-…`) — po zmianie nazwy trzeba zsynchronizować URL. */
export function isDuplicateProductHandle(handle: string): boolean {
	return /(?:^|-)kopia(?:-|$)/.test(handle);
}

export function slugifyProductTitle(title: string): string {
	return slugify(stripCopySuffixFromTitle(title));
}

/**
 * Nowy produkt / szkic: slug z tytułu (bez „(kopia)”).
 * Opublikowany: stabilny handle (SEO), chyba że to wciąż „kopia” z duplikatu
 * lub slug nie zgadza się z oczekiwanym adresem po zmianie nazwy kopii.
 */
export function resolveProductHandleForSave(input: {
	id?: string;
	title: string;
	handle?: string;
	status: "draft" | "published";
}): string {
	const fromTitle = slugifyProductTitle(input.title);
	if (!input.id) return fromTitle;

	const existing = input.handle?.trim() ?? "";
	if (!existing) return fromTitle;

	const shouldSyncFromTitle = input.status === "draft" || isDuplicateProductHandle(existing);

	if (shouldSyncFromTitle) {
		return fromTitle;
	}

	return existing;
}
