import "server-only";
import { cache } from "react";
import { fetchStoreMetadataBlob } from "./admin-read";
import { applyMediaUrlOverlay } from "./media-overlay";
import { DEFAULT_SITE_SETTINGS } from "./defaults";
import {
	getPageContentWithDefaults,
	parseGlobalContent,
	parsePageContentMap,
	parsePageSeoMap,
	parseSiteSettings,
} from "./parsers";
import type {
	ContentPageId,
	GlobalContent,
	PageContent,
	SeoMeta,
	SiteSettings,
} from "./types";

let mediaUrlMapCache: Record<string, string> | null = null;

function getStaticMediaUrlMap(): Record<string, string> {
	if (mediaUrlMapCache) return mediaUrlMapCache;
	try {
		const { STATIC_CMS_MEDIA_URL_MAP } = require("./static-cms-media-map") as {
			STATIC_CMS_MEDIA_URL_MAP?: Record<string, string>;
		};
		mediaUrlMapCache = STATIC_CMS_MEDIA_URL_MAP ?? {};
	} catch {
		mediaUrlMapCache = {};
	}
	return mediaUrlMapCache;
}

/**
 * Hybryda CMS:
 * - tekst / SEO → live z Medusa (tag `magazyn-content`, revalidate po zapisie),
 * - obrazy → tylko opublikowane z mapy prebuild (`/images/cms/…`); gate identyczny na localhost i prod.
 */
async function getContentBlob() {
	const live = await fetchStoreMetadataBlob();
	if (!live) return null;
	const map = getStaticMediaUrlMap();
	return applyMediaUrlOverlay(live, map);
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
	const blob = await getContentBlob();
	if (!blob?.siteSettings) return DEFAULT_SITE_SETTINGS;
	return parseSiteSettings(blob.siteSettings);
});

export const getPageSeo = cache(async (pageId: ContentPageId): Promise<SeoMeta | undefined> => {
	const blob = await getContentBlob();
	if (!blob?.pageSeo) return undefined;
	const map = parsePageSeoMap(blob.pageSeo);
	return map[pageId];
});

export const getPageContent = cache(async (pageId: ContentPageId): Promise<PageContent> => {
	const blob = await getContentBlob();
	const map = blob?.pageContent ? parsePageContentMap(blob.pageContent) : {};
	return getPageContentWithDefaults(map, pageId);
});

export const getGlobalContent = cache(async (): Promise<GlobalContent> => {
	const blob = await getContentBlob();
	if (!blob?.globalContent) {
		return parseGlobalContent(null);
	}
	return parseGlobalContent(blob.globalContent);
});

export type HomepageInstagramTile = {
	id: string;
	permalink: string;
	imageUrl: string;
	alt: string;
};

const DEFAULT_IG_ALT = "Lumine Concept na Instagramie";

export function instagramTilesFromGlobalContent(global: GlobalContent): HomepageInstagramTile[] {
	const rows = global.instagramTiles;
	if (!rows?.length) return [];
	return rows.slice(0, 6).map((row) => ({
		id: row.id,
		permalink: row.postUrl,
		imageUrl: row.imageUrl,
		alt: row.alt?.trim() || DEFAULT_IG_ALT,
	}));
}

export async function getHomepageInstagramTiles(): Promise<HomepageInstagramTile[]> {
	const global = await getGlobalContent();
	return instagramTilesFromGlobalContent(global);
}
