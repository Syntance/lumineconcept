import { describe, expect, it } from "vitest";
import { magazynConfig } from "@magazyn/magazyn.config";
import {
	CMS_STOREFRONT_WIRING,
	mapSalonLogosForMarquee,
	mapShopCategoryTiles,
	pickPageFaq,
	pickTestimonials,
	resolveAnnouncementBar,
	resolveFooterText,
	resolveInstagramProfileUrl,
	resolveInstagramTiles,
	resolveSocialLinks,
	resolveTrustBarDisplay,
} from "@/lib/content/cms-wiring";
import { DEFAULT_PAGE_CONTENT, DEFAULT_SITE_SETTINGS } from "@/lib/content/defaults";
import { mergeHeroWithDefaults } from "@/lib/content/parsers";
import { resolveHomeHero, resolveLogoHero } from "@/lib/content/hero";

describe("cms-wiring", () => {
	it("maps announcement bar when enabled", () => {
		expect(
			resolveAnnouncementBar({
				...DEFAULT_SITE_SETTINGS,
				announcementBar: { enabled: true, text: "Promo 72h", link: "/sklep" },
			}),
		).toEqual({ text: "Promo 72h", link: "/sklep" });
	});

	it("hides announcement bar when disabled or empty", () => {
		expect(
			resolveAnnouncementBar({
				...DEFAULT_SITE_SETTINGS,
				announcementBar: { enabled: false, text: "X" },
			}),
		).toBeNull();
		expect(
			resolveAnnouncementBar({
				...DEFAULT_SITE_SETTINGS,
				announcementBar: { enabled: true, text: "   " },
			}),
		).toBeNull();
	});

	it("resolveTrustBarDisplay falls back to defaults", () => {
		expect(resolveTrustBarDisplay({ followers: "99+" })).toMatchObject({
			followers: "99+",
			realizations: DEFAULT_SITE_SETTINGS.trustBar?.realizations,
		});
	});

	it("mapShopCategoryTiles uses CMS tiles when present", () => {
		const fallback = [{ title: "A", cta: "B", href: "/a", image: "/a.png" }] as const;
		const mapped = mapShopCategoryTiles(
			[{ title: "CMS", cta: "Zobacz", href: "/cms", imageUrl: "/cms.webp" }],
			fallback,
		);
		expect(mapped[0]?.title).toBe("CMS");
		expect(mapShopCategoryTiles(undefined, fallback)[0]?.title).toBe("A");
	});

	it("pickTestimonials and pickPageFaq respect order/limit", () => {
		expect(
			pickTestimonials(
				[
					{ id: "1", name: "A", company: "X", quote: "Q", rating: 5, order: 0 },
					{ id: "2", name: "B", company: "Y", quote: "Q2", rating: 5, order: 1 },
				],
				1,
			),
		).toHaveLength(1);
		expect(
			pickPageFaq([
				{ id: "2", question: "Q2", answer: "A2", order: 2 },
				{ id: "1", question: "Q1", answer: "A1", order: 1 },
			]).map((f) => f.id),
		).toEqual(["1", "2"]);
	});

	it("mapSalonLogosForMarquee uses alt for logo entries", () => {
		const entries = mapSalonLogosForMarquee({
			salonLogos: [{ id: "1", name: "Salon", alt: "Logo salonu", logoUrl: "/logo.png", order: 0 }],
		});
		expect(entries[0]).toEqual({ type: "logo", name: "Logo salonu", src: "/logo.png" });
	});

	it("resolveInstagramTiles limits to six posts", () => {
		const tiles = resolveInstagramTiles({
			instagramTiles: Array.from({ length: 8 }, (_, i) => ({
				id: String(i),
				postUrl: `https://instagram.com/p/${i}`,
				imageUrl: `https://cdn.example/${i}.webp`,
			})),
		});
		expect(tiles).toHaveLength(6);
	});

	it("resolveFooterText and social links use CMS values", () => {
		expect(
			resolveFooterText({
				...DEFAULT_SITE_SETTINGS,
				footerText: "Custom footer",
			}),
		).toBe("Custom footer");
		expect(
			resolveInstagramProfileUrl(
				resolveSocialLinks({
					...DEFAULT_SITE_SETTINGS,
					socialLinks: { instagram: "https://instagram.com/custom" },
				}),
			),
		).toBe("https://instagram.com/custom");
	});

	it("hero merge provides logo-3d background defaults", () => {
		const hero = mergeHeroWithDefaults(
			{
				headline: "Tablica z logo",
				description: "d",
				ctaLabel: "c",
				ctaHref: "#x",
			},
			"logo-3d",
		);
		expect(hero?.desktopImageUrl).toContain("logo-hero-bg");
		expect(resolveLogoHero(hero).desktopImageUrl).toContain("logo-hero-bg");
		expect(resolveHomeHero(mergeHeroWithDefaults(undefined, "home")).desktopImageUrl).toContain(
			"hero-main-wall",
		);
	});
});

describe("CMS config ↔ storefront wiring contract", () => {
	it("every configured global block has a documented consumer", () => {
		for (const block of magazynConfig.content.globalBlocks) {
			expect(CMS_STOREFRONT_WIRING.global[block as keyof typeof CMS_STOREFRONT_WIRING.global]).toBeTruthy();
		}
	});

	it("every configured page block has a documented consumer", () => {
		for (const page of magazynConfig.content.pages) {
			const wiring = CMS_STOREFRONT_WIRING.pages[page.id as keyof typeof CMS_STOREFRONT_WIRING.pages];
			expect(wiring).toBeTruthy();
			for (const block of page.blocks) {
				expect(wiring?.[block as keyof typeof wiring]).toBeTruthy();
			}
		}
	});

	it("default shop category tiles exist for fallback", () => {
		expect(DEFAULT_PAGE_CONTENT.shop?.categoryTiles?.length).toBeGreaterThan(0);
	});
});
