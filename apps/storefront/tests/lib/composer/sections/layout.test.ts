import { describe, expect, it } from "vitest";
import {
	LAYOUT_CLASSES,
	layoutAlignSchema,
	layoutBackgroundSchema,
	layoutColumnsSchema,
	layoutSizeSchema,
	layoutSpacingSchema,
	layoutVariantSchema,
	resolveLayoutClasses,
	sectionLayoutSchema,
} from "@/lib/composer/sections/layout";

describe("resolveLayoutClasses", () => {
	it("każda wartość enum align ma wpis w mapie", () => {
		for (const align of layoutAlignSchema.options) {
			expect(LAYOUT_CLASSES.align[align]).toBeDefined();
		}
	});

	it("każda wartość enum size/columns/spacing/background/variant ma wpis", () => {
		for (const size of layoutSizeSchema.options) {
			expect(LAYOUT_CLASSES.size[size]).toBeDefined();
		}
		for (const columns of layoutColumnsSchema.options) {
			expect(LAYOUT_CLASSES.columns[columns]).toBeDefined();
		}
		for (const spacing of layoutSpacingSchema.options) {
			expect(LAYOUT_CLASSES.spacing[spacing]).toBeDefined();
		}
		for (const background of layoutBackgroundSchema.options) {
			expect(LAYOUT_CLASSES.background[background]).toBeDefined();
		}
		for (const variant of layoutVariantSchema.options) {
			expect(LAYOUT_CLASSES.variant[variant]).toBeDefined();
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

	it("mobile override align — klasy max-lg", () => {
		const css = resolveLayoutClasses({
			align: "center",
			size: "md",
			columns: "2",
			spacing: "md",
			background: "none",
			fullWidth: false,
			variant: "light",
			mobile: { align: "left" },
		});
		expect(css).toContain("max-lg:");
	});

	it("Zod odrzuca align z XSS payload", () => {
		const result = sectionLayoutSchema.safeParse({
			align: '<script>alert(1)</script>',
			size: "md",
			columns: "1",
			spacing: "md",
			background: "none",
			fullWidth: false,
			variant: "light",
		});
		expect(result.success).toBe(false);
	});

	it("resolveLayoutClasses — nieznany align w runtime → fallback center", () => {
		const css = resolveLayoutClasses({
			align: "center" as "left",
			size: "md",
			columns: "1",
			spacing: "md",
			background: "none",
			fullWidth: false,
			variant: "light",
		});
		expect(css).toContain("items-center");
	});
});
