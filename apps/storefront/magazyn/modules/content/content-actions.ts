"use server";

import { redirect } from "next/navigation";
import { magazynConfig } from "@magazyn/magazyn.config";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { mediaUrlsChanged } from "@/lib/content/media-publish";
import type { GlobalContent, PageContent, SiteSettings } from "@/lib/content/types";
import { revalidateContentCache, queueCmsMediaPublish } from "./revalidate-content";
import {
	getContentBundle,
	getPageContentForAdmin,
	saveGlobalContent,
	savePageContent,
	saveSiteSettingsPartial,
} from "./content-store";
import {
	globalContentSchema,
	pageContentSchema,
	prepareGlobalContentForSave,
	preparePageContentForSave,
	siteSettingsSchema,
} from "@/lib/content/parsers";

export type SaveContentState = {
	ok: boolean;
	error: string | null;
	/** Deploy hook wysłany — sync obrazów w prebuild (~2–3 min). */
	mediaPublishQueued?: boolean;
};

export async function savePageContentAction(
	pageId: string,
	path: string,
	content: PageContent,
): Promise<SaveContentState> {
	const prepared = preparePageContentForSave(pageId, content);
	const parsed = pageContentSchema.safeParse(prepared);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane CMS." };
	}

	let previous: PageContent = {};
	try {
		previous = await getPageContentForAdmin(pageId);
		await savePageContent(pageId, parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać treści podstrony." };
	}

	const publishMedia = mediaUrlsChanged(previous, parsed.data);
	const rev = await revalidateContentCache([path], { publishMedia });
	return { ok: true, error: null, mediaPublishQueued: rev.mediaPublishQueued };
}

export async function saveGlobalContentAction(
	global: GlobalContent,
	paths: string[] = ["/"],
): Promise<SaveContentState> {
	const prepared = prepareGlobalContentForSave(global);
	const parsed = globalContentSchema.safeParse(prepared);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Błędne dane globalne.",
		};
	}

	let previous: GlobalContent = {};
	try {
		const bundle = await getContentBundle();
		previous = bundle.globalContent;
		await saveGlobalContent(parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać treści globalnych." };
	}

	const publishMedia = mediaUrlsChanged(previous, parsed.data);
	const rev = await revalidateContentCache(paths, { publishMedia });
	return { ok: true, error: null, mediaPublishQueued: rev.mediaPublishQueued };
}

export async function saveGlobalSiteSettingsAction(
	settings: SiteSettings,
): Promise<SaveContentState> {
	const parsed = siteSettingsSchema.safeParse(settings);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne ustawienia." };
	}

	let previous: SiteSettings | null = null;
	try {
		const bundle = await getContentBundle();
		previous = bundle.siteSettings;
		await saveSiteSettingsPartial(parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać ustawień." };
	}

	const publishMedia = mediaUrlsChanged(previous, parsed.data);
	const rev = await revalidateContentCache(["/"], { publishMedia });
	return { ok: true, error: null, mediaPublishQueued: rev.mediaPublishQueued };
}

/** Kolejkuje prebuild sync obrazów (np. zaraz po uploadzie w polu OG). */
export async function queueCmsMediaPublishAction(): Promise<{ queued: boolean }> {
	const queued = await queueCmsMediaPublish();
	return { queued };
}
