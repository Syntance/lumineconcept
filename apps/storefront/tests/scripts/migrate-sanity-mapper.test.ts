import { describe, expect, it } from "vitest";
import {
	mapGlobalContentToMetadata,
	mapPageContentFromSanity,
	mapProductFaqsByHandle,
	mapSiteSettingsToMetadata,
} from "@/scripts/migrate-sanity-mapper";
import { parseGlobalContent, parsePageContentMap, parseSiteSettings } from "@moduly/cms/parsers";
import { heroToPortalConfig, resolveHomeHero } from "@/lib/content/hero";

describe("migrate-sanity-mapper", () => {
	it("mapSiteSettingsToMetadata round-trips through parseSiteSettings", () => {
		const raw = mapSiteSettingsToMetadata({
			title: "Lumine",
			description: "Opis",
			seo: { metaTitle: "SEO title" },
			defaultOgImageUrl: "https://cdn.example/og.webp",
		});
		const parsed = parseSiteSettings(raw);
		expect(parsed.title).toBe("Lumine");
		expect(parsed.seo?.metaTitle).toBe("SEO title");
		expect(parsed.defaultOgImageUrl).toBe("https://cdn.example/og.webp");
	});

	it("mapPageContentFromSanity groups testimonials and faqs per page", () => {
		const pageContent = mapPageContentFromSanity({
			testimonials: [
				{
					_id: "t1",
					page: "shop",
					name: "Anna",
					company: "Salon",
					quote: "Super",
				},
			],
			faqs: [
				{
					_id: "f1",
					page: "global",
					question: "Q?",
					answer: "A.",
				},
			],
			galleryPhotos: [{ _key: "g1", imageUrl: "https://cdn.example/g.webp" }],
		});

		const map = parsePageContentMap(JSON.stringify(pageContent));
		expect(map.shop?.testimonials?.[0]?.name).toBe("Anna");
		expect(map["gotowe-wzory"]?.faq?.[0]?.question).toBe("Q?");
		expect(map["logo-3d"]?.gallery?.[0]?.imageUrl).toBe("https://cdn.example/g.webp");
		expect(map.certyfikaty?.testimonials).toBeUndefined();
	});

	it("copies gotowe-wzory testimonials to certyfikaty when missing", () => {
		const pageContent = mapPageContentFromSanity({
			testimonials: [
				{
					_id: "t1",
					page: "gotowe-wzory",
					name: "Anna",
					company: "Salon",
					quote: "Super",
				},
			],
			faqs: [],
		});
		const map = parsePageContentMap(JSON.stringify(pageContent));
		expect(map.certyfikaty?.testimonials?.[0]?.name).toBe("Anna");
	});

	it("mapGlobalContentToMetadata round-trips through parseGlobalContent", () => {
		const raw = mapGlobalContentToMetadata({
			salonLogos: [{ _id: "l1", name: "Salon", order: 0, logoUrl: "https://cdn.example/l.png" }],
			instagramTiles: [
				{ _key: "i1", postUrl: "https://instagram.com/p/1", imageUrl: "https://cdn.example/i.webp" },
			],
		});
		const parsed = parseGlobalContent(raw);
		expect(parsed.salonLogos?.[0]?.name).toBe("Salon");
		expect(parsed.instagramTiles?.[0]?.postUrl).toContain("instagram.com");
	});

	it("mapProductFaqsByHandle groups and sorts by order", () => {
		const map = mapProductFaqsByHandle([
			{ _id: "f2", productHandle: "tablica", question: "Q2", answer: "A2", order: 1 },
			{ _id: "f1", productHandle: "tablica", question: "Q1", answer: "A1", order: 0 },
		]);
		const list = map.get("tablica") ?? [];
		expect(list.map((f) => f.id)).toEqual(["f1", "f2"]);
	});
});

describe("hero helpers", () => {
	it("heroToPortalConfig maps CMS hero to portal config", () => {
		const portal = heroToPortalConfig({
			headline: "TEST",
			description: "desc",
			ctaLabel: "CTA",
			ctaHref: "/sklep",
			headlineUppercase: true,
		});
		expect(portal.headline).toBe("TEST");
		expect(portal.headlineUppercase).toBe(true);
	});

	it("resolveHomeHero falls back to copy defaults without image URLs", () => {
		const { portal, desktopImageUrl } = resolveHomeHero(undefined);
		expect(portal.headline).toBe("CONCEPT");
		expect(desktopImageUrl).toBeUndefined();
	});
});
