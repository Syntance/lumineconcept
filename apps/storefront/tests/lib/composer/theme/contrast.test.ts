import { describe, expect, it } from "vitest";
import {
	contrastRatio,
	meetsWcagAaNormal,
} from "@/lib/composer/theme/contrast";
import { DEFAULT_THEME_TOKENS } from "@/lib/composer/theme/defaults";
import { WCAG_CONTRAST_PAIRS } from "@/lib/composer/theme/schema";

describe("WCAG contrast", () => {
	it("czerń/biel ≈ 21:1", () => {
		const ratio = contrastRatio("oklch(0 0 0)", "oklch(1 0 0)");
		expect(ratio).not.toBeNull();
		expect(ratio!).toBeGreaterThan(20);
		expect(ratio!).toBeLessThanOrEqual(21);
	});

	it("dwie bliskie szarości mają kontrast < 4.5:1", () => {
		const ratio = contrastRatio("oklch(0.5 0 0)", "oklch(0.55 0 0)");
		expect(ratio).not.toBeNull();
		expect(ratio!).toBeLessThan(4.5);
	});

	it("obecna paleta brandowa — pary WCAG bez fałszywych negatywów", () => {
		for (const pair of WCAG_CONTRAST_PAIRS) {
			const fg = DEFAULT_THEME_TOKENS.colors[pair.foregroundKey];
			const bg = DEFAULT_THEME_TOKENS.colors[pair.backgroundKey];
			expect(meetsWcagAaNormal(fg, bg)).toBe(true);
		}
	});
});
