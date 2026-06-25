import dynamic from "next/dynamic";
import { getGlobalContent } from "@/lib/content";
import { resolvePopupBannersForStorefront } from "@/lib/content/popup-banners";

const PopupBanner = dynamic(
	() => import("./PopupBanner").then((mod) => mod.PopupBanner),
	{ ssr: false },
);

/** Warstwa banerów popup — lazy client, opóźnione mount (PageSpeed / LCP). */
export async function PopupBannerLayer() {
	const global = await getGlobalContent();
	const config = global.popupBanners;
	const banners = resolvePopupBannersForStorefront(config);
	if (!config?.enabled || banners.length === 0) return null;

	return <PopupBanner banners={banners} rawItems={config.items ?? []} />;
}
