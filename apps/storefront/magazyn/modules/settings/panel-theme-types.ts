import { z } from "zod";
import { getModulyConfig() } from "@moduly/magazyn-core/config";

const cssColor = z.string().trim().min(1, "Podaj kolor.");

export const panelBrandingSchema = z.object({
	name: z.string().trim().min(1, "Podaj nazwę marki."),
	panelTitle: z.string().trim().min(1, "Podaj tytuł panelu."),
	storefrontUrl: z.string().trim().url("Podaj poprawny adres sklepu."),
});

export const panelColorsSchema = z.object({
	background: cssColor,
	foreground: cssColor,
	card: cssColor,
	cardForeground: cssColor,
	muted: cssColor,
	mutedForeground: cssColor,
	primary: cssColor,
	primaryForeground: cssColor,
	border: cssColor,
	input: cssColor,
	ring: cssColor,
	destructive: cssColor,
});

export const panelThemeSchema = z.object({
	branding: panelBrandingSchema,
	colors: panelColorsSchema,
	radiusPx: z.number().int().min(0).max(24),
});

export const panelThemePresetIdSchema = z.enum(["lumine", "retro-jasny", "retro-ciemny"]);

export const panelThemeSelectionSchema = z.object({
	presetId: panelThemePresetIdSchema,
});

export type PanelBranding = z.infer<typeof panelBrandingSchema>;
export type PanelColors = z.infer<typeof panelColorsSchema>;
export type PanelTheme = z.infer<typeof panelThemeSchema>;
export type PanelThemePresetId = z.infer<typeof panelThemePresetIdSchema>;
export type PanelThemeSelection = z.infer<typeof panelThemeSelectionSchema>;

export type PanelThemePreset = {
	id: PanelThemePresetId;
	label: string;
	description: string;
	theme: PanelTheme;
};

const DEFAULT_BRANDING: PanelBranding = {
	name: getModulyConfig().branding.name,
	panelTitle: getModulyConfig().branding.panelTitle,
	storefrontUrl: getModulyConfig().branding.storefrontUrl,
};

export const DEFAULT_PANEL_THEME_PRESET_ID: PanelThemePresetId = "lumine";

export const DEFAULT_PANEL_THEME: PanelTheme = {
	branding: DEFAULT_BRANDING,
	colors: {
		background: "#ffffff",
		foreground: "#725750",
		card: "#ffffff",
		cardForeground: "#725750",
		muted: "#f5f4f2",
		mutedForeground: "#8f7a74",
		primary: "#AF7C61",
		primaryForeground: "#ffffff",
		border: "#e8e4df",
		input: "#e8e4df",
		ring: "#a89a94",
		destructive: "#dc2626",
	},
	radiusPx: 10,
};

/** Gotowe palety panelu — bez ręcznej edycji tokenów (wzorzec jak theme.css w magazynie). */
export const PANEL_THEME_PRESETS: PanelThemePreset[] = [
	{
		id: "lumine",
		label: "Lumine",
		description: "Domyślny motyw marki — biel, brąz i miedź.",
		theme: DEFAULT_PANEL_THEME,
	},
	{
		id: "retro-jasny",
		label: "Kremowy",
		description: "Ciepły jasny panel — kość słoniowa i terakota (jak RetroHouse).",
		theme: {
			branding: DEFAULT_BRANDING,
			colors: {
				background: "oklch(0.985 0.008 80)",
				foreground: "oklch(0.20 0.025 35)",
				card: "oklch(0.995 0.004 80)",
				cardForeground: "oklch(0.20 0.025 35)",
				muted: "oklch(0.89 0.035 80)",
				mutedForeground: "oklch(0.39 0.07 45)",
				primary: "oklch(0.52 0.15 38)",
				primaryForeground: "oklch(0.99 0.005 80)",
				border: "oklch(0.39 0.07 45 / 0.13)",
				input: "oklch(0.39 0.07 45 / 0.18)",
				ring: "oklch(0.52 0.15 38 / 0.45)",
				destructive: "oklch(0.55 0.18 28)",
			},
			radiusPx: 14,
		},
	},
	{
		id: "retro-ciemny",
		label: "Ciemny brąz",
		description: "Niski kontrast światła — ciemny brąz i krem (jak dark mode RetroHouse).",
		theme: {
			branding: DEFAULT_BRANDING,
			colors: {
				background: "oklch(0.18 0.025 35)",
				foreground: "oklch(0.92 0.025 80)",
				card: "oklch(0.22 0.03 35)",
				cardForeground: "oklch(0.92 0.025 80)",
				muted: "oklch(0.27 0.035 38)",
				mutedForeground: "oklch(0.74 0.04 70)",
				primary: "oklch(0.62 0.16 38)",
				primaryForeground: "oklch(0.18 0.025 35)",
				border: "oklch(1 0 0 / 10%)",
				input: "oklch(1 0 0 / 15%)",
				ring: "oklch(0.62 0.16 38 / 0.55)",
				destructive: "oklch(0.704 0.191 22.216)",
			},
			radiusPx: 14,
		},
	},
];

export function getPanelThemePreset(id: PanelThemePresetId): PanelThemePreset {
	const preset = PANEL_THEME_PRESETS.find((entry) => entry.id === id);
	return preset ?? PANEL_THEME_PRESETS[0]!;
}

export function themeFromPresetId(id: PanelThemePresetId): PanelTheme {
	return getPanelThemePreset(id).theme;
}

export function parsePanelTheme(raw: unknown): PanelTheme | null {
	const parsed = panelThemeSchema.safeParse(raw);
	return parsed.success ? parsed.data : null;
}

function parseStoredSelection(raw: unknown): PanelThemeSelection | null {
	if (typeof raw === "string" && raw.trim()) {
		try {
			const parsed = panelThemeSelectionSchema.safeParse(JSON.parse(raw) as unknown);
			return parsed.success ? parsed.data : null;
		} catch {
			return null;
		}
	}
	if (raw && typeof raw === "object") {
		const parsed = panelThemeSelectionSchema.safeParse(raw);
		return parsed.success ? parsed.data : null;
	}
	return null;
}

/** Aktywny preset z metadanych (nowy format) lub domyślny Lumine. */
export function resolveActivePresetId(raw: unknown): PanelThemePresetId {
	const selection = parseStoredSelection(raw);
	if (selection) return selection.presetId;

	const legacy = parsePanelTheme(
		typeof raw === "string" && raw.trim() ? safeJsonParse(raw) : raw,
	);
	if (!legacy) return DEFAULT_PANEL_THEME_PRESET_ID;

	const match = PANEL_THEME_PRESETS.find(
		(preset) => JSON.stringify(preset.theme.colors) === JSON.stringify(legacy.colors),
	);
	return match?.id ?? DEFAULT_PANEL_THEME_PRESET_ID;
}

function safeJsonParse(raw: string): unknown {
	try {
		return JSON.parse(raw) as unknown;
	} catch {
		return null;
	}
}

export function mergePanelTheme(saved: PanelTheme | null): PanelTheme {
	if (!saved) return DEFAULT_PANEL_THEME;
	return {
		branding: { ...DEFAULT_BRANDING, ...saved.branding },
		colors: { ...DEFAULT_PANEL_THEME.colors, ...saved.colors },
		radiusPx: saved.radiusPx ?? DEFAULT_PANEL_THEME.radiusPx,
	};
}
