export type ColorCategoryDefinition = {
	id: string;
	label: string;
	matDefault: boolean;
};

export const DEFAULT_COLOR_CATEGORIES: ColorCategoryDefinition[] = [
	{ id: "standard", label: "Standardowe", matDefault: true },
	{ id: "color", label: "Kolorowe", matDefault: true },
	{ id: "mirror", label: "Lustrzane", matDefault: false },
	{ id: "custom", label: "Indywidualny", matDefault: true },
];

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
