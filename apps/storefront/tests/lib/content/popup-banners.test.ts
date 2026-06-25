import { describe, expect, it } from "vitest";
import {
	bannerMatchesPath,
	pathnameMatchesPopupTarget,
	pickPopupBannerForPath,
	resolvePopupBannersForStorefront,
} from "@/lib/content/popup-banners";
import type { PopupBanner, PopupBannersConfig } from "@/lib/content/types";

describe("popup-banners", () => {
	it("matches home path only on root", () => {
		expect(pathnameMatchesPopupTarget("/", "home")).toBe(true);
		expect(pathnameMatchesPopupTarget("/sklep", "home")).toBe(false);
	});

	it("matches shop subtree", () => {
		expect(pathnameMatchesPopupTarget("/sklep", "shop")).toBe(true);
		expect(pathnameMatchesPopupTarget("/sklep/logo-3d", "shop")).toBe(true);
	});

	it("resolves enabled banners with blur default", () => {
		const config: PopupBannersConfig = {
			enabled: true,
			items: [
				{
					id: "a",
					enabled: true,
					pageIds: ["all"],
					title: "Promo",
					order: 0,
				},
			],
		};
		const banners = resolvePopupBannersForStorefront(config);
		expect(banners).toHaveLength(1);
		expect(banners[0]?.blurBackground).toBe(true);
		expect(banners[0]?.tabLabel).toBe("Oferta");
		expect(banners[0]?.tabIcon).toBe("mail");
	});

	it("picks first banner for pathname", () => {
		const raw: PopupBanner[] = [
			{ id: "shop", enabled: true, pageIds: ["shop"], title: "Sklep", order: 0 },
			{ id: "home", enabled: true, pageIds: ["home"], title: "Home", order: 1 },
		];
		const banners = resolvePopupBannersForStorefront({ enabled: true, items: raw });
		expect(pickPopupBannerForPath(banners, raw, "/sklep")?.id).toBe("shop");
		expect(pickPopupBannerForPath(banners, raw, "/")?.id).toBe("home");
	});

	it("all target matches every path", () => {
		const banner: PopupBanner = {
			id: "x",
			enabled: true,
			pageIds: ["all"],
			title: "T",
			order: 0,
		};
		expect(bannerMatchesPath(banner, "/o-nas")).toBe(true);
	});
});
