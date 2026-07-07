import { z } from "zod";
import { FONT_TOKEN_IDS } from "./fonts";

/**
 * Walidacja kolorów OKLCH — jedyny dozwolony format tokenów motywu.
 * Odrzuca wstrzyknięcia HTML/JS w wartości koloru.
 */
export const OKLCH_COLOR_PATTERN =
	/^oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.]+%?)?\s*\)$/i;

export const oklchColorSchema = z
	.string()
	.trim()
	.regex(OKLCH_COLOR_PATTERN, "Kolor musi być w formacie oklch(L C H) lub oklch(L C H / A)")
	.refine((v) => !/[<>{}]/.test(v), "Niedozwolone znaki w kolorze");

export const fontTokenSchema = z.enum(FONT_TOKEN_IDS);

export const themeFontsSchema = z.object({
	body: fontTokenSchema,
	display: fontTokenSchema,
	serif: fontTokenSchema,
});

export const themeBrandColorsSchema = z.object({
	brand50: oklchColorSchema,
	brand100: oklchColorSchema,
	brand200: oklchColorSchema,
	brand300: oklchColorSchema,
	brand400: oklchColorSchema,
	brand500: oklchColorSchema,
	brand600: oklchColorSchema,
	brand700: oklchColorSchema,
	brand800: oklchColorSchema,
	brand900: oklchColorSchema,
	brandReadable: oklchColorSchema,
	onBrand800: oklchColorSchema,
	accentDark: oklchColorSchema,
});

export const themeSemanticColorsSchema = z.object({
	background: oklchColorSchema,
	foreground: oklchColorSchema,
	primary: oklchColorSchema,
	primaryForeground: oklchColorSchema,
	accent: oklchColorSchema,
	accentForeground: oklchColorSchema,
	muted: oklchColorSchema,
	mutedForeground: oklchColorSchema,
	border: oklchColorSchema,
	card: oklchColorSchema,
	cardForeground: oklchColorSchema,
});

export const themeColorsSchema = themeSemanticColorsSchema.merge(themeBrandColorsSchema);

export const themeRadiusSchema = z
	.string()
	.trim()
	.regex(/^[\d.]+rem$/, "Promień musi być wartością w rem (np. 0.625rem)");

export const themeTokensSchema = z.object({
	colors: themeColorsSchema,
	radius: themeRadiusSchema,
	fonts: themeFontsSchema,
});

/** Pary kolorów sprawdzane pod kątem WCAG AA w edytorze motywu. */
export const WCAG_CONTRAST_PAIRS = [
	{
		id: "fg-on-bg",
		label: "Tekst główny na tle strony",
		foregroundKey: "foreground",
		backgroundKey: "background",
	},
	{
		id: "accent-fg",
		label: "Tekst na akcentcie",
		foregroundKey: "accentForeground",
		backgroundKey: "accent",
	},
	{
		id: "muted-fg",
		label: "Tekst drugorzędny na tle muted",
		foregroundKey: "mutedForeground",
		backgroundKey: "muted",
	},
	{
		id: "primary-fg",
		label: "Tekst na primary",
		foregroundKey: "primaryForeground",
		backgroundKey: "primary",
	},
] as const satisfies ReadonlyArray<{
	id: string;
	label: string;
	foregroundKey: keyof z.infer<typeof themeColorsSchema>;
	backgroundKey: keyof z.infer<typeof themeColorsSchema>;
}>;

export type ThemeTokens = z.infer<typeof themeTokensSchema>;
export type ThemeColors = z.infer<typeof themeColorsSchema>;
export type ThemeFonts = z.infer<typeof themeFontsSchema>;
