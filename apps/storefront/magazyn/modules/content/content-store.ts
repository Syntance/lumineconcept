import "server-only";
import {
	MAGAZYN_GLOBAL_CONTENT_KEY,
	MAGAZYN_PAGE_CONTENT_KEY,
	MAGAZYN_SITE_SETTINGS_KEY,
	MAGAZYN_THEME_TOKENS_KEY,
} from "@/lib/content/metadata-keys";
import {
	globalContentSchema,
	pageContentMapSchema,
	pageContentSchema,
	parseGlobalContentForAdmin,
	parseJsonValue,
	parsePageContentMapForAdmin,
	parseSiteSettingsForAdmin,
	siteSettingsSchema,
} from "@/lib/content/parsers";
import {
	parseThemeTokensForAdmin,
	prepareThemeTokensForSave,
	themeTokensSchema,
} from "@/lib/composer/theme";
import type { ThemeTokens } from "@/lib/composer/theme";
import type { GlobalContent, PageContent, PageContentMap, SiteSettings } from "@/lib/content/types";
import { getMedusaStore, mergeStoreMetadata, readMetadataJson } from "./store-metadata";

export type ContentBundle = {
	siteSettings: SiteSettings;
	pageContent: PageContentMap;
	globalContent: GlobalContent;
	themeTokens: ThemeTokens;
};

export async function getContentBundle(): Promise<ContentBundle> {
	const store = await getMedusaStore();
	return {
		siteSettings: parseSiteSettingsForAdmin(readMetadataJson(store, MAGAZYN_SITE_SETTINGS_KEY)),
		pageContent: parsePageContentMapForAdmin(readMetadataJson(store, MAGAZYN_PAGE_CONTENT_KEY)),
		globalContent: parseGlobalContentForAdmin(readMetadataJson(store, MAGAZYN_GLOBAL_CONTENT_KEY)),
		themeTokens: parseThemeTokensForAdmin(readMetadataJson(store, MAGAZYN_THEME_TOKENS_KEY)),
	};
}

export async function savePageContent(pageId: string, content: PageContent): Promise<void> {
	const store = await getMedusaStore();
	const raw = readMetadataJson(store, MAGAZYN_PAGE_CONTENT_KEY);
	const current = parseJsonValue(raw, pageContentMapSchema) ?? {};
	const parsedPage = pageContentSchema.parse(content);
	const next: PageContentMap = { ...current, [pageId]: parsedPage };
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

export async function saveThemeTokens(tokens: ThemeTokens): Promise<void> {
	const prepared = prepareThemeTokensForSave(tokens);
	const parsed = themeTokensSchema.parse(prepared);
	await mergeStoreMetadata({
		[MAGAZYN_THEME_TOKENS_KEY]: JSON.stringify(parsed),
	});
}

export async function getPageContentForAdmin(pageId: string): Promise<PageContent> {
	const bundle = await getContentBundle();
	return bundle.pageContent[pageId as keyof PageContentMap] ?? {};
}
