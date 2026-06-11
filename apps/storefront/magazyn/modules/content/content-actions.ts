"use server";

import { redirect } from "next/navigation";
import { magazynConfig } from "@magazyn/magazyn.config";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import {
	globalContentSchema,
	pageContentSchema,
	prepareGlobalContentForSave,
	preparePageContentForSave,
	siteSettingsSchema,
} from "@/lib/content/parsers";
import type { GlobalContent, PageContent, SiteSettings } from "@/lib/content/types";
import { revalidateContentCache } from "./revalidate-content";
import {
	saveGlobalContent,
	savePageContent,
	saveSiteSettingsPartial,
} from "./content-store";

export type SaveContentState = { ok: boolean; error: string | null };

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

	try {
		await savePageContent(pageId, parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać treści podstrony." };
	}

	await revalidateContentCache([path]);
	return { ok: true, error: null };
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

	try {
		await saveGlobalContent(parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać treści globalnych." };
	}

	await revalidateContentCache(paths);
	return { ok: true, error: null };
}

export async function saveGlobalSiteSettingsAction(
	settings: SiteSettings,
): Promise<SaveContentState> {
	const parsed = siteSettingsSchema.safeParse(settings);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne ustawienia." };
	}

	try {
		await saveSiteSettingsPartial(parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać ustawień." };
	}

	await revalidateContentCache(["/"]);
	return { ok: true, error: null };
}
