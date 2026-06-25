import { magazynConfig } from "@magazyn/magazyn.config";
import type { ContentPageId, PopupBanner, PopupBannersConfig } from "./types";

export type PopupBannerDisplay = {
	id: string;
	title?: string;
	body?: string;
	link?: string;
	linkLabel?: string;
	imageUrl?: string;
	blurBackground: boolean;
};

export function pathnameMatchesPopupTarget(pathname: string, target: ContentPageId): boolean {
	const page = magazynConfig.content.pages.find((entry) => entry.id === target);
	if (!page) return false;
	if (page.path === "/") return pathname === "/";
	return pathname === page.path || pathname.startsWith(`${page.path}/`);
}

export function bannerMatchesPath(banner: PopupBanner, pathname: string): boolean {
	if (!banner.pageIds.length || banner.pageIds.includes("all")) return true;
	return banner.pageIds.some(
		(id) => id !== "all" && pathnameMatchesPopupTarget(pathname, id),
	);
}

function toDisplay(banner: PopupBanner): PopupBannerDisplay | null {
	if (!banner.enabled) return null;
	const title = banner.title?.trim();
	const body = banner.body?.trim();
	const link = banner.link?.trim();
	const imageUrl = banner.imageUrl?.trim();
	if (!title && !body && !imageUrl && !link) return null;

	return {
		id: banner.id,
		title: title || undefined,
		body: body || undefined,
		link: link || undefined,
		linkLabel: banner.linkLabel?.trim() || undefined,
		imageUrl: imageUrl || undefined,
		blurBackground: banner.blurBackground !== false,
	};
}

/** Banery gotowe do renderu na storefront (posortowane, bez wyłączonych). */
export function resolvePopupBannersForStorefront(
	config: PopupBannersConfig | undefined,
): PopupBannerDisplay[] {
	if (!config?.enabled) return [];
	return (config.items ?? [])
		.slice()
		.sort((a, b) => a.order - b.order)
		.map(toDisplay)
		.filter((item): item is PopupBannerDisplay => item !== null);
}

/** Pierwszy baner pasujący do bieżącej ścieżki. */
export function pickPopupBannerForPath(
	banners: PopupBannerDisplay[],
	rawItems: PopupBanner[],
	pathname: string,
): PopupBannerDisplay | null {
	const orderMap = new Map(rawItems.map((item) => [item.id, item]));
	for (const banner of banners) {
		const raw = orderMap.get(banner.id);
		if (raw && bannerMatchesPath(raw, pathname)) return banner;
	}
	return null;
}
