import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS } from "@/lib/composer/theme/defaults";
import { renderThemeCss, renderThemeCssWithFallback } from "@/lib/composer/theme/render-css";

describe("renderThemeCss", () => {
	it("generuje :root z kluczowymi zmiennymi CSS", () => {
		const css = renderThemeCss(DEFAULT_THEME_TOKENS);
		expect(css).toMatchSnapshot();
		expect(css).toContain(":root {");
		expect(css).toContain("--accent: oklch(0.627 0.089 52.3);");
		expect(css).toContain("--font-sans: var(--font-gilroy), system-ui, sans-serif;");
		expect(css).toContain("--font-display: var(--font-chronicle), Georgia, serif;");
		expect(css).toContain("--radius: 0.625rem;");
	});

	it("fallback gdy metadata puste lub uszkodzone", () => {
		expect(renderThemeCssWithFallback(null)).toBe(renderThemeCss(DEFAULT_THEME_TOKENS));
		expect(renderThemeCssWithFallback("not-json")).toBe(renderThemeCss(DEFAULT_THEME_TOKENS));
		expect(renderThemeCssWithFallback({ colors: { accent: "#bad" } })).toBe(
			renderThemeCss(DEFAULT_THEME_TOKENS),
		);
	});
});
