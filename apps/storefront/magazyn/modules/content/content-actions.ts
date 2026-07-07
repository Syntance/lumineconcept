"use server";

import { redirect } from "next/navigation";
import { magazynConfig } from "@magazyn/magazyn.config";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { requireAdminSession } from "@magazyn/core/auth/require-session";
import type { GlobalContent, PageContent, SiteSettings, ContentPageId } from "@/lib/content/types";
import type { PageSection } from "@/lib/composer/sections/schema";
import { pageSectionsArraySchema } from "@/lib/composer/sections/parse";
import { revalidateContentCache, triggerCmsRedeploy } from "./revalidate-content";
import {
	saveGlobalContent,
	savePageContent,
	saveSiteSettingsPartial,
	saveThemeTokens,
	savePageSectionsDraft,
	publishPageSections,
	restorePageSectionsVersion,
} from "./content-store";
import {
	globalContentSchema,
	pageContentSchema,
	prepareGlobalContentForSave,
	preparePageContentForSave,
	siteSettingsSchema,
} from "@/lib/content/parsers";
import { prepareThemeTokensForSave, themeTokensSchema } from "@/lib/composer/theme";
import type { ThemeTokens } from "@/lib/composer/theme";

export type SaveContentState = {
	ok: boolean;
	error: string | null;
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

	try {
		await savePageContent(pageId, parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać treści podstrony." };
	}

	const revalidatePaths = [path, `${magazynConfig.basePath}/panel/cms/${pageId}`];
	if (pageId === "home") {
		revalidatePaths.push("/sklep");
	}
	await revalidateContentCache(revalidatePaths);
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

export async function saveThemeTokensAction(tokens: ThemeTokens): Promise<SaveContentState> {
	const prepared = prepareThemeTokensForSave(tokens);
	const parsed = themeTokensSchema.safeParse(prepared);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Błędne tokeny motywu.",
		};
	}

	try {
		await saveThemeTokens(parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać motywu." };
	}

	await revalidateContentCache(["/"]);
	return { ok: true, error: null };
}

export type RedeployContentState = {
	ok: boolean;
	error: string | null;
	/** Deploy hook wysłany — sync obrazów w prebuild (~2–3 min). */
	queued: boolean;
};

/** Ręczny redeploy storefrontu (sync obrazów CMS → `/public/images/cms/`). */
export async function triggerCmsRedeployAction(): Promise<RedeployContentState> {
	try {
		await requireAdminSession();
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		return { ok: false, error: "Brak sesji administratora.", queued: false };
	}

	const hookConfigured = Boolean(process.env.VERCEL_DEPLOY_HOOK_URL?.trim());
	const queued = await triggerCmsRedeploy("CMS manual redeploy (panel)");
	if (!queued) {
		return {
			ok: false,
			error: hookConfigured
				? "Nie udało się uruchomić redeploy na Vercel. Spróbuj ponownie za chwilę."
				: "Deploy hook nie jest skonfigurowany (VERCEL_DEPLOY_HOOK_URL).",
			queued: false,
		};
	}

	return { ok: true, error: null, queued: true };
}

export async function savePageSectionsDraftAction(
	pageId: ContentPageId,
	path: string,
	sections: PageSection[],
): Promise<SaveContentState> {
	const parsed = pageSectionsArraySchema.safeParse(sections);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Błędne sekcje strony.",
		};
	}

	try {
		await requireAdminSession();
		await savePageSectionsDraft(pageId, parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać szkicu sekcji." };
	}

	await revalidateContentCache([path, `${magazynConfig.basePath}/panel/cms/podglad/${pageId}`]);
	return { ok: true, error: null };
}

export async function publishPageSectionsAction(
	pageId: ContentPageId,
	path: string,
	sections: PageSection[],
): Promise<SaveContentState> {
	const parsed = pageSectionsArraySchema.safeParse(sections);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message ?? "Błędne sekcje strony.",
		};
	}

	try {
		await requireAdminSession();
		await publishPageSections(pageId, parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się opublikować sekcji." };
	}

	await revalidateContentCache([path, `${magazynConfig.basePath}/panel/cms/podglad/${pageId}`]);
	return { ok: true, error: null };
}

export async function restorePageSectionsVersionAction(
	pageId: ContentPageId,
	path: string,
	versionIndex: number,
): Promise<SaveContentState> {
	try {
		await requireAdminSession();
		const restored = await restorePageSectionsVersion(pageId, versionIndex);
		if (!restored) {
			return { ok: false, error: "Nie znaleziono wersji do przywrócenia." };
		}
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się przywrócić wersji." };
	}

	await revalidateContentCache([path, `${magazynConfig.basePath}/panel/cms/podglad/${pageId}`]);
	return { ok: true, error: null };
}
