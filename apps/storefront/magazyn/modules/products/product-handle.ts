import { slugify } from "@magazyn/core/lib/slug";

const COPY_TITLE_SUFFIX = /\s*\(kopia\)\s*$/i;

/** Usuwa sufiks „(kopia)” z nazwy — slug nie powinien go zawierać po zmianie tytułu. */
export function stripCopySuffixFromTitle(title: string): string {
	return title.trim().replace(COPY_TITLE_SUFFIX, "").trim();
}

/** Handle z duplikatu (`…-kopia`, `produkt-kopia-…`) — sygnał do wymuszonej resynchronizacji. */
export function isDuplicateProductHandle(handle: string): boolean {
	return /(?:^|-)kopia(?:-|$)/.test(handle);
}

export function slugifyProductTitle(title: string): string {
	return slugify(stripCopySuffixFromTitle(title));
}

/**
 * Slug URL zawsze z aktualnej nazwy produktu (bez sufiksu „(kopia)”).
 * Po zmianie tytułu w magazynie adres aktualizuje się przy zapisie.
 */
export function resolveProductHandleForSave(input: {
	id?: string;
	title: string;
	handle?: string;
	status: "draft" | "published";
}): string {
	void input.id;
	void input.handle;
	void input.status;
	return slugifyProductTitle(input.title);
}
