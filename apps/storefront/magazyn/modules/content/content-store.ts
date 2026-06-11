import "server-only";
import {
	MAGAZYN_GLOBAL_CONTENT_KEY,
	MAGAZYN_PAGE_CONTENT_KEY,
	MAGAZYN_SITE_SETTINGS_KEY,
} from "@/lib/content/metadata-keys";
import {
	globalContentSchema,
	pageContentMapSchema,
	parseGlobalContent,
	parsePageContentMap,
	parseSiteSettings,
	siteSettingsSchema,
} from "@/lib/content/parsers";
import type { GlobalContent, PageContent, PageContentMap, SiteSettings } from "@/lib/content/types";
import { getMedusaStore, mergeStoreMetadata, readMetadataJson } from "./store-metadata";

export type ContentBundle = {
	siteSettings: SiteSettings;
	pageContent: PageContentMap;
	globalContent: GlobalContent;
};

export async function getContentBundle(): Promise<ContentBundle> {
	const store = await getMedusaStore();
	return {
		siteSettings: parseSiteSettings(readMetadataJson(store, MAGAZYN_SITE_SETTINGS_KEY)),
		pageContent: parsePageContentMap(readMetadataJson(store, MAGAZYN_PAGE_CONTENT_KEY)),
		globalContent: parseGlobalContent(readMetadataJson(store, MAGAZYN_GLOBAL_CONTENT_KEY)),
	};
}

export async function savePageContent(pageId: string, content: PageContent): Promise<void> {
	const store = await getMedusaStore();
	const current = parsePageContentMap(readMetadataJson(store, MAGAZYN_PAGE_CONTENT_KEY));
	const next: PageContentMap = { ...current, [pageId]: content };
	const parsed = pageContentMapSchema.parse(next);
	await mergeStoreMetadata({
		[MAGAZYN_PAGE_CONTENT_KEY]: JSON.stringify(parsed),
	});
}

export async function saveGlobalContent(global: GlobalContent): Promise<void> {
	const parsed = globalContentSchema.parse(global);
	await mergeStoreMetadata({
		[MAGAZYN_GLOBAL_CONTENT_KEY]: JSON.stringify(parsed),
	});
}

export async function saveSiteSettingsPartial(settings: SiteSettings): Promise<void> {
	const parsed = siteSettingsSchema.parse(settings);
	await mergeStoreMetadata({
		[MAGAZYN_SITE_SETTINGS_KEY]: JSON.stringify(parsed),
	});
}

export async function getPageContentForAdmin(pageId: string): Promise<PageContent> {
	const bundle = await getContentBundle();
	return bundle.pageContent[pageId as keyof PageContentMap] ?? {};
}
