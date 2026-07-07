import type { ThemeTokens } from "./schema";

/**
 * Domyślny motyw = wartości z `styles/globals.css` (:root + @theme brand),
 * wyrażone w OKLCH tam gdzie composer wymaga tego formatu.
 * Hex z brandbooka przeliczone na OKLCH (≈ wizualnie identyczne).
 */
export const DEFAULT_THEME_TOKENS: ThemeTokens = {
	colors: {
		background: "oklch(1 0 0)",
		foreground: "oklch(0.438 0.024 48.5)",
		primary: "oklch(0.216 0.006 56.043)",
		primaryForeground: "oklch(0.985 0.001 106.423)",
		accent: "oklch(0.627 0.089 52.3)",
		accentForeground: "oklch(1 0 0)",
		muted: "oklch(0.97 0.001 106.424)",
		mutedForeground: "oklch(0.573 0.022 48.2)",
		border: "oklch(0.923 0.003 48.717)",
		card: "oklch(1 0 0)",
		cardForeground: "oklch(0.438 0.024 48.5)",
		brand50: "oklch(0.965 0.012 75)",
		brand100: "oklch(0.935 0.018 75)",
		brand200: "oklch(0.885 0.032 68)",
		brand300: "oklch(0.82 0.048 62)",
		brand400: "oklch(0.72 0.072 55)",
		brand500: "oklch(0.627 0.089 52.3)",
		brand600: "oklch(0.52 0.065 48)",
		brand700: "oklch(0.48 0.045 45)",
		brand800: "oklch(0.438 0.024 48.5)",
		brand900: "oklch(0.32 0.022 42)",
		brandReadable: "oklch(0.48 0.045 45)",
		onBrand800: "oklch(0.9 0.025 75)",
		accentDark: "oklch(0.438 0.024 48.5)",
	},
	radius: "0.625rem",
	fonts: {
		body: "gilroy",
		display: "chronicle",
		serif: "chronicle",
	},
};
