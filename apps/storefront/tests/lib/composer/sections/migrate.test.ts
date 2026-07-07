import { describe, expect, it } from "vitest";
import { migratePageContentToSections } from "@/lib/composer/sections/migrate";
import { DEFAULT_PAGE_CONTENT } from "@/lib/content/defaults";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ContentPageId } from "@/lib/content/types";

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

	it.each(
		magazynConfig.content.pages.map((p) => p.id) as ContentPageId[],
	)("strona %s — migracja bez wyjątku", (pageId) => {
		const sections = migratePageContentToSections(pageId, {});
		expect(Array.isArray(sections)).toBe(true);
		for (const s of sections) {
			expect(s.id).toBeTruthy();
			expect(s.type).toBeTruthy();
		}
	});

	it("o-nas — hero i about", () => {
		const sections = migratePageContentToSections("o-nas", {
			hero: DEFAULT_PAGE_CONTENT["o-nas"]?.hero,
			about: { introHeading: "O NAS" },
		});
		expect(sections.map((s) => s.type)).toEqual(["hero", "about"]);
	});

	it("logo-3d — hero i gallery", () => {
		const sections = migratePageContentToSections("logo-3d", {
			hero: DEFAULT_PAGE_CONTENT["logo-3d"]?.hero,
			gallery: [{ id: "g1", imageUrl: "/x.webp", order: 0 }],
		});
		expect(sections.map((s) => s.type)).toEqual(["hero", "gallery"]);
	});
});
