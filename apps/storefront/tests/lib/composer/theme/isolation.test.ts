import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS } from "@/lib/composer/theme/defaults";
import { parseThemeTokens } from "@/lib/composer/theme/parse";
import { renderThemeCss, renderThemeCssWithFallback } from "@/lib/composer/theme/render-css";
import { themeTokensSchema } from "@/lib/composer/theme/schema";

describe("izolacja motywu (Etap 1)", () => {
	it("wstrzyknięty XSS w kolorze nie trafia do wygenerowanego CSS", () => {
		const malicious = {
			...DEFAULT_THEME_TOKENS,
			colors: {
				...DEFAULT_THEME_TOKENS.colors,
				accent: "oklch(0.5 0.1 30);}</style><script>alert(1)</script>",
			},
		};
		expect(themeTokensSchema.safeParse(malicious).success).toBe(false);
		const css = renderThemeCssWithFallback(malicious);
		expect(css).not.toContain("<script>");
		expect(css).not.toContain("</style>");
		expect(css).toContain(`--accent: ${DEFAULT_THEME_TOKENS.colors.accent}`);
	});

	it("metadata puste → domyślny motyw brandowy (fallback)", () => {
		const tokens = parseThemeTokens(null);
		const css = renderThemeCss(tokens);
		expect(css).toContain("--accent:");
		expect(tokens.fonts.body).toBe("gilroy");
	});

	it("częściowo uszkodzone metadata → merge z defaults, bez surowych wartości z bazy", () => {
		const tokens = parseThemeTokens({
			colors: { accent: "#AF7C61" },
			fonts: { body: "evil-font" },
		});
		expect(tokens.colors.accent).toBe(DEFAULT_THEME_TOKENS.colors.accent);
		expect(tokens.fonts.body).toBe("gilroy");
	});

	it("renderThemeCss używa wyłącznie znanych nazw właściwości CSS", () => {
		const css = renderThemeCss(DEFAULT_THEME_TOKENS);
		expect(css).toMatch(/^:root \{--[\w-]+:/);
		expect(css).not.toMatch(/javascript:/i);
	});
});
