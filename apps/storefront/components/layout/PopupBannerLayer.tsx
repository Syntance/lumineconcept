import { getGlobalContent } from "@/lib/content";
import { resolvePopupBannersForStorefront } from "@/lib/content/popup-banners";
import { PopupBannerClient } from "./PopupBannerClient";

/** Warstwa banerów popup — dane z RSC, render lazy po stronie klienta. */
export async function PopupBannerLayer() {
	const global = await getGlobalContent();
	const config = global.popupBanners;
	const banners = resolvePopupBannersForStorefront(config);
	if (!config?.enabled || banners.length === 0) return null;

	return <PopupBannerClient banners={banners} rawItems={config.items ?? []} />;
}
