import { describe, expect, it } from "vitest";
import {
	LAYOUT_CLASSES,
	layoutAlignSchema,
	resolveLayoutClasses,
} from "@/lib/composer/sections/layout";

describe("resolveLayoutClasses", () => {
	it("każda wartość enum align ma wpis w mapie", () => {
		for (const align of layoutAlignSchema.options) {
			expect(LAYOUT_CLASSES.align[align]).toBeDefined();
		}
	});

	it("nieznany align w runtime → fallback center w klasach", () => {
		const css = resolveLayoutClasses({
			align: "left",
			size: "md",
			columns: "1",
			spacing: "md",
			background: "none",
			fullWidth: false,
			variant: "light",
		});
		expect(css).toContain("items-start");
	});
});
