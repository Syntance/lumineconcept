import "server-only";
import { cache } from "react";
import { fetchStoreMetadataBlob } from "./admin-read";
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

// Static CMS content - używane na production dla ultra-szybkiego loadingu
let STATIC_CACHE: any = null;

function getStaticContent() {
	if (STATIC_CACHE) return STATIC_CACHE;
	
	try {
		const { STATIC_CMS_CONTENT } = require("./static-cms-content");
		// Check if it's real content (not dev fallback)
		if (STATIC_CMS_CONTENT && Object.keys(STATIC_CMS_CONTENT.magazyn_site_settings || {}).length > 0) {
			STATIC_CACHE = {
				siteSettings: STATIC_CMS_CONTENT.magazyn_site_settings,
				pageContent: STATIC_CMS_CONTENT.magazyn_page_content,
				globalContent: STATIC_CMS_CONTENT.magazyn_global_content,
				pageSeo: STATIC_CMS_CONTENT.magazyn_page_seo,
			};
			console.log("✓ Using static CMS content (ultra-fast mode)");
		}
	} catch {
		// File doesn't exist or error - fallback to dynamic
	}
	
	return STATIC_CACHE;
}

async function getContentBlob() {
	// Try static first (production builds)
	const staticContent = getStaticContent();
	if (staticContent) return staticContent;
	
	// Fallback to dynamic fetch (dev mode)
	return await fetchStoreMetadataBlob();
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
