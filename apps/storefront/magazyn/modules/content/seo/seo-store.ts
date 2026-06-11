import "server-only";
import {
	MAGAZYN_PAGE_SEO_KEY,
	MAGAZYN_SITE_SETTINGS_KEY,
} from "@/lib/content/metadata-keys";
import {
	parsePageSeoMap,
	parseSiteSettings,
	siteSettingsSchema,
	pageSeoMapSchema,
	normalizeSeoMeta,
} from "@/lib/content/parsers";
import type { PageSeoMap, SeoMeta, SiteSettings } from "@/lib/content/types";
import { getMedusaStore, mergeStoreMetadata, readMetadataJson } from "../store-metadata";

export type SeoSettingsBundle = {
	siteSettings: SiteSettings;
	pageSeo: PageSeoMap;
};

export async function getSeoSettingsBundle(): Promise<SeoSettingsBundle> {
	const store = await getMedusaStore();
	return {
		siteSettings: parseSiteSettings(readMetadataJson(store, MAGAZYN_SITE_SETTINGS_KEY)),
		pageSeo: parsePageSeoMap(readMetadataJson(store, MAGAZYN_PAGE_SEO_KEY)),
	};
}

export async function saveGlobalSeoSettings(settings: SiteSettings): Promise<void> {
	const parsed = siteSettingsSchema.parse(settings);
	await mergeStoreMetadata({
		[MAGAZYN_SITE_SETTINGS_KEY]: JSON.stringify(parsed),
	});
}

export async function savePageSeo(pageId: string, seo: SeoMeta): Promise<void> {
	const store = await getMedusaStore();
	const current = parsePageSeoMap(readMetadataJson(store, MAGAZYN_PAGE_SEO_KEY));
	const next: PageSeoMap = {
		...current,
		[pageId]: normalizeSeoMeta(seo) ?? {},
	};
	const parsed = pageSeoMapSchema.parse(next);
	await mergeStoreMetadata({
		[MAGAZYN_PAGE_SEO_KEY]: JSON.stringify(parsed),
	});
}

export async function saveAllPageSeo(pageSeo: PageSeoMap): Promise<void> {
	const parsed = pageSeoMapSchema.parse(pageSeo);
	await mergeStoreMetadata({
		[MAGAZYN_PAGE_SEO_KEY]: JSON.stringify(parsed),
	});
}
