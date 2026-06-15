import { slugify } from "@moduly/magazyn-core";

/** Id kategorii kolorów (slug, np. standard, mirror, moje-kolory). */
export type ColorCategoryId = string;

export type ColorCategoryDefinition = {
	id: ColorCategoryId;
	label: string;
	matDefault: boolean;
};

export const DEFAULT_COLOR_CATEGORIES: ColorCategoryDefinition[] = [
	{ id: "standard", label: "Standardowe", matDefault: true },
	{ id: "color", label: "Kolorowe", matDefault: true },
	{ id: "mirror", label: "Lustrzane", matDefault: false },
	{ id: "custom", label: "Indywidualny", matDefault: true },
];

/** @deprecated Użyj DEFAULT_COLOR_CATEGORIES */
export const COLOR_CATEGORY_SECTIONS = DEFAULT_COLOR_CATEGORIES;

export function slugifyCategoryId(label: string): string {
	const base = slugify(label);
	return base.length > 0 ? base : `kategoria-${Date.now()}`;
}

export function parseColorCategories(raw: unknown): ColorCategoryDefinition[] {
	if (typeof raw === "string" && raw.trim()) {
		try {
			return parseColorCategories(JSON.parse(raw) as unknown);
		} catch {
			return DEFAULT_COLOR_CATEGORIES;
		}
	}

	if (!Array.isArray(raw)) {
		return DEFAULT_COLOR_CATEGORIES;
	}

	const parsed = raw
		.filter(
			(entry): entry is ColorCategoryDefinition =>
				!!entry &&
				typeof entry === "object" &&
				typeof (entry as ColorCategoryDefinition).id === "string" &&
				typeof (entry as ColorCategoryDefinition).label === "string",
		)
		.map((entry) => ({
			id: entry.id.trim(),
			label: entry.label.trim(),
			matDefault: entry.matDefault !== false,
		}))
		.filter((entry) => entry.id.length > 0 && entry.label.length > 0);

	return parsed.length > 0 ? parsed : DEFAULT_COLOR_CATEGORIES;
}

export function categoryIds(categories: readonly ColorCategoryDefinition[]): ColorCategoryId[] {
	return categories.map((entry) => entry.id);
}

export function findCategoryDefinition(
	categories: readonly ColorCategoryDefinition[],
	id: string,
): ColorCategoryDefinition | undefined {
	return categories.find((entry) => entry.id === id);
}

export function normalizeHexInput(raw: string): string | null {
	const trimmed = raw.trim();
	if (trimmed.toLowerCase() === "transparent") return "transparent";
	const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
	if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) return null;
	return withHash.toLowerCase();
}

/** Pusty lub sam `#` → bezbarwny (`transparent`); inaczej walidacja HEX. */
export function resolveHexInputOrTransparent(raw: string): string | null {
	const trimmed = raw.trim();
	if (trimmed === "" || trimmed === "#") return "transparent";
	return normalizeHexInput(raw);
}
