/** Kategorie kolorów w globalnej konfiguracji (color_category w Medusa). */
export type ColorCategoryId = "standard" | "color" | "mirror" | "custom";

export const COLOR_CATEGORY_SECTIONS: ReadonlyArray<{
	id: ColorCategoryId;
	label: string;
	matDefault: boolean;
}> = [
	{ id: "standard", label: "Standardowe", matDefault: true },
	{ id: "color", label: "Kolorowe", matDefault: true },
	{ id: "mirror", label: "Lustrzane", matDefault: false },
	{ id: "custom", label: "Indywidualny", matDefault: true },
] as const;

export function normalizeHexInput(raw: string): string | null {
	const trimmed = raw.trim();
	if (trimmed.toLowerCase() === "transparent") return "transparent";
	const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
	if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) return null;
	return withHash.toLowerCase();
}
