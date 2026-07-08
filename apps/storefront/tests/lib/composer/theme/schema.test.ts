import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS } from "@/lib/composer/theme/defaults";
import { themeTokensSchema } from "@/lib/composer/theme/schema";

describe("themeTokensSchema", () => {
	it("akceptuje poprawny payload domyślny", () => {
		const result = themeTokensSchema.safeParse(DEFAULT_THEME_TOKENS);
		expect(result.success).toBe(true);
	});

	it("odrzuca kolor spoza formatu OKLCH (hex)", () => {
		const result = themeTokensSchema.safeParse({
			...DEFAULT_THEME_TOKENS,
			colors: { ...DEFAULT_THEME_TOKENS.colors, accent: "#AF7C61" },
		});
		expect(result.success).toBe(false);
	});

	it("odrzuca font spoza białej listy", () => {
		const result = themeTokensSchema.safeParse({
			...DEFAULT_THEME_TOKENS,
			fonts: { display: "comic-sans", body: "gilroy", serif: "chronicle" },
		});
		expect(result.success).toBe(false);
	});

	it("odrzuca wstrzyknięty markup w kolorze", () => {
		const result = themeTokensSchema.safeParse({
			...DEFAULT_THEME_TOKENS,
			colors: {
				...DEFAULT_THEME_TOKENS.colors,
				accent: "oklch(0.5 0.1 180);</style><script>alert(1)</script>",
			},
		});
		expect(result.success).toBe(false);
	});
});
