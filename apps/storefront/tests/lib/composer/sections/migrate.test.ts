import { describe, expect, it } from "vitest";
import { migratePageContentToSections } from "@/lib/composer/sections/migrate";
import { DEFAULT_PAGE_CONTENT } from "@/lib/content/defaults";

describe("migratePageContentToSections", () => {
	it("home — hero, bestsellers, socialProof, cta w kolejności", () => {
		const sections = migratePageContentToSections("home", {
			hero: DEFAULT_PAGE_CONTENT.home?.hero,
			bestsellers: { productIds: ["prod_1"], title: "Bestsellery" },
			brandingCta: DEFAULT_PAGE_CONTENT.home?.brandingCta,
		});
		const types = sections.map((s) => s.type);
		expect(types).toContain("hero");
		expect(types).toContain("bestsellers");
		expect(types).toContain("socialProof");
		expect(types).toContain("cta");
		expect(types.indexOf("socialProof")).toBeGreaterThan(types.indexOf("bestsellers"));
	});

	it("shop — categoryTiles i testimonials", () => {
		const sections = migratePageContentToSections("shop", {
			categoryTiles: [
				{
					title: "Tablice",
					cta: "Zobacz",
					href: "/sklep/tablice-z-logo",
					imageUrl: "/images/cms/tile.webp",
				},
			],
			testimonials: [
				{
					id: "t1",
					name: "Anna",
					company: "Salon",
					quote: "Super",
					rating: 5,
					order: 0,
				},
			],
		});
		expect(sections.some((s) => s.type === "categoryTiles")).toBe(true);
		expect(sections.some((s) => s.type === "testimonials")).toBe(true);
	});
});
