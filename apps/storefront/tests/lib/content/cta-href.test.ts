import { describe, expect, it } from "vitest";
import { normalizeHeroCtaHref } from "@/lib/content/cta-href";

describe("normalizeHeroCtaHref", () => {
	it("zostawia czysty hash", () => {
		expect(normalizeHeroCtaHref("#formularz")).toBe("#formularz");
	});

	it("usuwa zdublowane fragmenty", () => {
		expect(normalizeHeroCtaHref("#formularz#formularz#formularz")).toBe("#formularz");
		expect(normalizeHeroCtaHref("/sklep/logo-3d#formularz#formularz")).toBe(
			"/sklep/logo-3d#formularz",
		);
	});

	it("nie zmienia zwykłych ścieżek", () => {
		expect(normalizeHeroCtaHref("/sklep")).toBe("/sklep");
	});
});
