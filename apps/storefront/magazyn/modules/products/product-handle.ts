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

type ProductHandleInput = {
	id: string;
	title: string;
	handle: string;
	created_at?: string | null;
};

/**
 * Przypisuje unikalne slugi z tytułów (starszy produkt dostaje bazowy slug).
 * Przy kolizji: `nazwa-2`, `nazwa-3`, …
 */
export function allocateUniqueProductHandles(
	products: ReadonlyArray<ProductHandleInput>,
): Map<string, string> {
	const sorted = [...products].sort((a, b) => {
		const ta = a.created_at ?? "";
		const tb = b.created_at ?? "";
		if (ta !== tb) return ta.localeCompare(tb);
		return a.id.localeCompare(b.id);
	});

	const used = new Set<string>();
	const result = new Map<string, string>();

	for (const product of sorted) {
		const base = slugifyProductTitle(product.title);
		let candidate = base;
		let suffix = 2;
		while (used.has(candidate)) {
			candidate = `${base}-${suffix}`;
			suffix += 1;
		}
		used.add(candidate);
		result.set(product.id, candidate);
	}

	return result;
}
