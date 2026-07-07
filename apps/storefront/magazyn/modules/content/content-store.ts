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
import type { ContentPageId } from "@/lib/content/types";
import { magazynConfig } from "@magazyn/magazyn.config";
import {
	prepareSectionsForSave,
	parseSectionHistory,
	safeParseSectionsJson,
} from "@/lib/composer/sections/parse";
import type { PageSection, PageSections, SectionHistory } from "@/lib/composer/sections/schema";
import {
	pageSectionsDraftKey,
	pageSectionsHistoryKey,
	pageSectionsLiveKey,
	MAX_HISTORY_VERSIONS,
} from "@/lib/composer/sections/store-keys";
import { getMedusaStore, mergeStoreMetadata, readMetadataJson } from "./store-metadata";

export type ContentBundle = {
	siteSettings: SiteSettings;
	pageContent: PageContentMap;
	globalContent: GlobalContent;
	themeTokens: ThemeTokens;
	pageSectionsDraft: Partial<Record<ContentPageId, PageSections>>;
};

export async function getContentBundle(): Promise<ContentBundle> {
	const store = await getMedusaStore();
	const pageSectionsDraft: Partial<Record<ContentPageId, PageSections>> = {};
	for (const page of magazynConfig.content.pages) {
		const id = page.id as ContentPageId;
		const raw = readMetadataJson(store, pageSectionsDraftKey(id));
		const sections = safeParseSectionsJson(raw);
		if (sections.length) pageSectionsDraft[id] = sections;
	}
	return {
		siteSettings: parseSiteSettingsForAdmin(readMetadataJson(store, MAGAZYN_SITE_SETTINGS_KEY)),
		pageContent: parsePageContentMapForAdmin(readMetadataJson(store, MAGAZYN_PAGE_CONTENT_KEY)),
		globalContent: parseGlobalContentForAdmin(readMetadataJson(store, MAGAZYN_GLOBAL_CONTENT_KEY)),
		themeTokens: parseThemeTokensForAdmin(readMetadataJson(store, MAGAZYN_THEME_TOKENS_KEY)),
		pageSectionsDraft,
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

export async function savePageSectionsDraft(
	pageId: ContentPageId,
	sections: PageSection[],
): Promise<void> {
	const parsed = prepareSectionsForSave(sections);
	await mergeStoreMetadata({
		[pageSectionsDraftKey(pageId)]: JSON.stringify(parsed),
	});
}

export async function publishPageSections(
	pageId: ContentPageId,
	sections: PageSection[],
): Promise<void> {
	const store = await getMedusaStore();
	const parsed = prepareSectionsForSave(sections);

	const historyRaw = readMetadataJson(store, pageSectionsHistoryKey(pageId));
	const history = parseSectionHistory(
		typeof historyRaw === "string" ? JSON.parse(historyRaw) : historyRaw,
	);
	const liveRaw = readMetadataJson(store, pageSectionsLiveKey(pageId));
	const currentLive = safeParseSectionsJson(liveRaw);
	if (currentLive.length > 0) {
		history.versions.unshift({
			savedAt: new Date().toISOString(),
			sections: currentLive,
		});
	}
	history.versions = history.versions.slice(0, MAX_HISTORY_VERSIONS);

	await mergeStoreMetadata({
		[pageSectionsLiveKey(pageId)]: JSON.stringify(parsed),
		[pageSectionsDraftKey(pageId)]: JSON.stringify(parsed),
		[pageSectionsHistoryKey(pageId)]: JSON.stringify(history),
	});
}

export async function restorePageSectionsVersion(
	pageId: ContentPageId,
	versionIndex: number,
): Promise<PageSections | null> {
	const store = await getMedusaStore();
	const historyRaw = readMetadataJson(store, pageSectionsHistoryKey(pageId));
	const history = parseSectionHistory(
		typeof historyRaw === "string" ? JSON.parse(historyRaw) : historyRaw,
	);
	const version = history.versions[versionIndex];
	if (!version) return null;
	const parsed = prepareSectionsForSave(version.sections);
	await mergeStoreMetadata({
		[pageSectionsLiveKey(pageId)]: JSON.stringify(parsed),
		[pageSectionsDraftKey(pageId)]: JSON.stringify(parsed),
	});
	return parsed;
}

export async function getPageSectionsHistoryForAdmin(
	pageId: ContentPageId,
): Promise<SectionHistory> {
	const store = await getMedusaStore();
	const historyRaw = readMetadataJson(store, pageSectionsHistoryKey(pageId));
	return parseSectionHistory(
		typeof historyRaw === "string" ? JSON.parse(historyRaw) : historyRaw,
	);
}
