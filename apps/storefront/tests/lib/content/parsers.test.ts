import { describe, expect, it } from "vitest";
import {
	parseGlobalContent,
	parsePageContentMap,
	parsePageContentMapForAdmin,
	parsePageSeoMap,
	parseProductFaqFromMetadata,
	parseProductSeoFromMetadata,
	parseSiteSettings,
	prepareGlobalContentForSave,
	globalContentSchema,
} from "@moduly/cms/parsers";
import { buildMetadata } from "@/lib/content/metadata";

describe("content parsers", () => {
	it("parseSiteSettings round-trips JSON", () => {
		const raw = JSON.stringify({
			title: "Test Shop",
			description: "Opis",
			trustBar: { followers: "100+" },
		});
		const parsed = parseSiteSettings(raw);
		expect(parsed.title).toBe("Test Shop");
		expect(parsed.trustBar?.followers).toBe("100+");
	});

	it("parsePageSeoMap returns empty on invalid", () => {
		expect(parsePageSeoMap("not-json")).toEqual({});
	});

	it("parsePageContentMap merges defaults for home hero", () => {
		const map = parsePageContentMap(JSON.stringify({ home: { hero: { headline: "X", description: "d", ctaLabel: "c", ctaHref: "/" } } }));
		expect(map.home?.hero?.headline).toBe("X");
	});

	it("parseGlobalContent falls back to default logos", () => {
		const g = parseGlobalContent(null);
		expect(g.salonLogos?.length).toBeGreaterThan(0);
	});

	it("globalContentSchema accepts relative logo paths from public/", () => {
		const result = globalContentSchema.safeParse({
			salonLogos: [{ id: "1", name: "Salon", logoUrl: "/images/logos/test.png", order: 0 }],
		});
		expect(result.success).toBe(true);
	});

	it("prepareGlobalContentForSave drops incomplete instagram tiles", () => {
		const prepared = prepareGlobalContentForSave({
			salonLogos: [{ id: "1", name: "Salon", order: 0 }],
			instagramTiles: [
				{ id: "ig1", postUrl: "", imageUrl: "" },
				{
					id: "ig2",
					postUrl: "https://www.instagram.com/p/abc/",
					imageUrl: "https://cdn.example/t.webp",
				},
			],
		});
		expect(prepared.instagramTiles).toHaveLength(1);
		expect(globalContentSchema.safeParse(prepared).success).toBe(true);
	});

	it("parsePageContentMap ukrywa nieopublikowane obrazy galerii (R2)", () => {
		const remote = "https://pub-abc.r2.dev/cms-uploads/realizacja.webp";
		const map = parsePageContentMap(
			JSON.stringify({
				"logo-3d": {
					gallery: [{ id: "1", imageUrl: remote, order: 0 }],
				},
			}),
		);
		expect(map["logo-3d"]?.gallery).toEqual([]);
	});

	it("parsePageContentMapForAdmin zachowuje nieopublikowane obrazy galerii (R2)", () => {
		const remote = "https://pub-abc.r2.dev/cms-uploads/realizacja.webp";
		const map = parsePageContentMapForAdmin(
			JSON.stringify({
				"logo-3d": {
					gallery: [{ id: "1", imageUrl: remote, order: 0 }],
				},
			}),
		);
		expect(map["logo-3d"]?.gallery?.[0]?.imageUrl).toBe(remote);
	});

	it("parsePageContentMap serwuje opublikowane obrazy z /images/cms/", () => {
		const local = "/images/cms/realizacja.webp";
		const map = parsePageContentMap(
			JSON.stringify({
				"logo-3d": {
					gallery: [{ id: "1", imageUrl: local, order: 0 }],
				},
			}),
		);
		expect(map["logo-3d"]?.gallery?.[0]?.imageUrl).toBe(local);
	});

	it("mergeHeroWithDefaults does not inject hardcoded hero images", () => {
		const map = parsePageContentMap(
			JSON.stringify({
				"logo-3d": {
					hero: {
						headline: "Tablica z logo",
						description: "Opis",
						ctaLabel: "CTA",
						ctaHref: "#formularz",
					},
				},
			}),
		);
		expect(map["logo-3d"]?.hero?.desktopImageUrl).toBeUndefined();
	});

	it("parseProductSeoFromMetadata reads seo keys", () => {
		const seo = parseProductSeoFromMetadata({
			seo_meta_title: "Tytuł",
			seo_no_index: "true",
		});
		expect(seo?.metaTitle).toBe("Tytuł");
		expect(seo?.noIndex).toBe(true);
	});

	it("parseProductFaqFromMetadata sorts by order", () => {
		const faq = parseProductFaqFromMetadata({
			product_faq: JSON.stringify([
				{ id: "2", question: "Q2", answer: "A2", order: 2 },
				{ id: "1", question: "Q1", answer: "A1", order: 1 },
			]),
		});
		expect(faq[0]?.id).toBe("1");
	});
});

describe("buildMetadata", () => {
	it("uses seo fields and fallbacks", () => {
		const meta = buildMetadata({
			seo: { metaTitle: "Custom", ogImageUrl: "https://cdn.example/og.webp" },
			fallbackTitle: "Fallback",
			fallbackDescription: "Desc",
			path: "/sklep",
		});
		expect(meta.title).toBe("Custom");
    expect(meta.openGraph?.images).toEqual([{ url: "https://cdn.example/og.webp", width: 1200, height: 630 }]);
	});
});

describe("migration mapping shape", () => {
	it("maps sanity testimonial to cms testimonial", () => {
		const sanityRow = {
			_id: "t1",
			name: "Anna",
			company: "Salon",
			quote: "Super",
			rating: 5,
			order: 0,
		};
		const mapped = {
			id: sanityRow._id,
			name: sanityRow.name,
			company: sanityRow.company,
			quote: sanityRow.quote,
			rating: sanityRow.rating,
			order: sanityRow.order,
		};
		const pageContent = parsePageContentMap(JSON.stringify({ shop: { testimonials: [mapped] } }));
		expect(pageContent.shop?.testimonials?.[0]?.name).toBe("Anna");
	});

	it("parsePageSeoMap stores per-page seo", () => {
		const map = parsePageSeoMap(
			JSON.stringify({
				shop: { metaTitle: "Sklep SEO", metaDescription: "Opis sklepu" },
			}),
		);
		expect(map.shop?.metaTitle).toBe("Sklep SEO");
	});
});
