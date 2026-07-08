import type { ThemeTokens } from "./schema";
import { parseThemeTokens } from "./parse";
import { fontStackForToken } from "./fonts";

/**
 * Renderuje blok CSS `:root { --... }` z walidowanych tokenów motywu.
 * Wyłącznie stałe nazwy właściwości + wartości z Zod — zero interpolacji z bazy poza enum.
 */
export function renderThemeCss(tokens: ThemeTokens): string {
	const { colors: c, radius, fonts } = tokens;

	const lines: string[] = [
		":root {",
		`--background: ${c.background};`,
		`--foreground: ${c.foreground};`,
		`--card: ${c.card};`,
		`--card-foreground: ${c.cardForeground};`,
		`--primary: ${c.primary};`,
		`--primary-foreground: ${c.primaryForeground};`,
		`--accent: ${c.accent};`,
		`--accent-foreground: ${c.accentForeground};`,
		`--muted: ${c.muted};`,
		`--muted-foreground: ${c.mutedForeground};`,
		`--border: ${c.border};`,
		`--radius: ${radius};`,
		`--color-brand-50: ${c.brand50};`,
		`--color-brand-100: ${c.brand100};`,
		`--color-brand-200: ${c.brand200};`,
		`--color-brand-300: ${c.brand300};`,
		`--color-brand-400: ${c.brand400};`,
		`--color-brand-500: ${c.brand500};`,
		`--color-brand-600: ${c.brand600};`,
		`--color-brand-700: ${c.brand700};`,
		`--color-brand-800: ${c.brand800};`,
		`--color-brand-900: ${c.brand900};`,
		`--color-brand-readable: ${c.brandReadable};`,
		`--color-on-brand-800: ${c.onBrand800};`,
		`--color-accent-dark: ${c.accentDark};`,
		`--font-sans: ${fontStackForToken(fonts.body)};`,
		`--font-display: ${fontStackForToken(fonts.display)};`,
		`--font-serif: ${fontStackForToken(fonts.serif)};`,
		"}",
	];

	return lines.join("");
}

/** Render z fallbackiem do domyślnego motywu brandowego (metadata puste/uszkodzone). */
export function renderThemeCssWithFallback(raw: unknown): string {
	return renderThemeCss(parseThemeTokens(raw));
}
