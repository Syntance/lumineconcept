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

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
	const blob = await fetchStoreMetadataBlob();
	if (!blob?.siteSettings) return DEFAULT_SITE_SETTINGS;
	return parseSiteSettings(blob.siteSettings);
});

export const getPageSeo = cache(async (pageId: ContentPageId): Promise<SeoMeta | undefined> => {
	const blob = await fetchStoreMetadataBlob();
	if (!blob?.pageSeo) return undefined;
	const map = parsePageSeoMap(blob.pageSeo);
	return map[pageId];
});

export const getPageContent = cache(async (pageId: ContentPageId): Promise<PageContent> => {
	const blob = await fetchStoreMetadataBlob();
	const map = blob?.pageContent ? parsePageContentMap(blob.pageContent) : {};
	return getPageContentWithDefaults(map, pageId);
});

export const getGlobalContent = cache(async (): Promise<GlobalContent> => {
	const blob = await fetchStoreMetadataBlob();
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
