import { describe, expect, it } from "vitest";
import { pageSectionsArraySchema, pageSectionSchema } from "@/lib/composer/sections/schema";
import { parsePageSections, parsePageSection } from "@/lib/composer/sections/parse";

describe("pageSectionSchema", () => {
	it("odrzuca nieznany typ sekcji", () => {
		const result = pageSectionSchema.safeParse({
			id: "x1",
			type: "unknown",
			props: {},
		});
		expect(result.success).toBe(false);
	});

	it("akceptuje hero z wymaganymi polami", () => {
		const result = pageSectionSchema.safeParse({
			id: "hero-1",
			type: "hero",
			props: {
				headline: "Test",
				description: "Opis",
				ctaLabel: "CTA",
				ctaHref: "/sklep",
			},
		});
		expect(result.success).toBe(true);
	});
});

describe("pageSectionsArraySchema", () => {
	it("odrzuca więcej niż 20 sekcji", () => {
		const sections = Array.from({ length: 21 }, (_, i) => ({
			id: `rich-${i}`,
			type: "richText" as const,
			props: { bodyHtml: "<p>x</p>" },
		}));
		const result = pageSectionsArraySchema.safeParse(sections);
		expect(result.success).toBe(false);
	});
});

describe("parsePageSections", () => {
	it("nieprawidłowy JSON → pusta tablica", () => {
		expect(parsePageSections(null)).toEqual([]);
		expect(parsePageSection({ type: "faq" })).toBeNull();
	});
});
