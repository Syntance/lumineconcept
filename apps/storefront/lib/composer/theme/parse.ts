import { DEFAULT_THEME_TOKENS } from "./defaults";
import { themeTokensSchema, type ThemeTokens } from "./schema";

function deepMergeTheme(partial: Partial<ThemeTokens>, base: ThemeTokens): ThemeTokens {
	return {
		colors: { ...base.colors, ...partial.colors },
		radius: partial.radius ?? base.radius,
		fonts: { ...base.fonts, ...partial.fonts },
	};
}

/**
 * Parsuje tokeny motywu z Store.metadata — defensywnie z fallbackiem do defaults.
 */
export function parseThemeTokens(raw: unknown): ThemeTokens {
	if (raw === null || raw === undefined) {
		return DEFAULT_THEME_TOKENS;
	}

	let parsed: unknown = raw;
	if (typeof raw === "string") {
		try {
			parsed = JSON.parse(raw) as unknown;
		} catch {
			return DEFAULT_THEME_TOKENS;
		}
	}

	const result = themeTokensSchema.safeParse(parsed);
	if (!result.success) {
		const partial = themeTokensSchema.partial().safeParse(parsed);
		if (partial.success) {
			return deepMergeTheme(partial.data, DEFAULT_THEME_TOKENS);
		}
		return DEFAULT_THEME_TOKENS;
	}

	return result.data;
}

/** Parsowanie dla panelu admina — ścisła walidacja (zapis). */
export function parseThemeTokensForAdmin(raw: unknown): ThemeTokens {
	if (typeof raw === "string") {
		try {
			return themeTokensSchema.parse(JSON.parse(raw));
		} catch {
			return DEFAULT_THEME_TOKENS;
		}
	}
	const result = themeTokensSchema.safeParse(raw);
	return result.success ? result.data : DEFAULT_THEME_TOKENS;
}

/** Przygotowanie payloadu przed zapisem (identyczność — walidacja w server action). */
export function prepareThemeTokensForSave(tokens: ThemeTokens): ThemeTokens {
	return tokens;
}
