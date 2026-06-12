"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { magazynConfig } from "@magazyn/magazyn.config";
import { AdminApiError, AdminUnauthorizedError } from "@magazyn/core/medusa/errors";
import { mediaUrlsChanged } from "@/lib/content/media-publish";
import { siteSettingsSchema } from "@/lib/content/parsers";
import type { SeoMeta } from "@/lib/content/types";
import { revalidateContentCache } from "../revalidate-content";
import { getSeoSettingsBundle, saveGlobalSeoSettings, savePageSeo } from "./seo-store";
import type { SaveContentState } from "../content-actions";

export type SaveSeoState = SaveContentState;

const seoFieldsSchema = z.object({
	metaTitle: z.string().max(70).optional(),
	metaDescription: z.string().max(160).optional(),
	ogTitle: z.string().optional(),
	ogDescription: z.string().optional(),
	ogImageUrl: z.string().optional(),
	canonicalUrl: z.string().optional(),
	noIndex: z.boolean().optional(),
	noFollow: z.boolean().optional(),
});

const globalSeoPayloadSchema = z.object({
	title: z.string().min(1),
	description: z.string(),
	titleTemplate: z.string().optional(),
	defaultOgImageUrl: z.string().optional(),
	googleSiteVerification: z.string().optional(),
	seo: seoFieldsSchema.optional(),
});

export async function saveGlobalSeoAction(
	payload: z.infer<typeof globalSeoPayloadSchema>,
): Promise<SaveSeoState> {
	const parsed = globalSeoPayloadSchema.safeParse(payload);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane." };
	}

	let previous: Record<string, unknown> = {};
	try {
		const bundle = await getSeoSettingsBundle();
		previous = {
			title: bundle.siteSettings.title,
			description: bundle.siteSettings.description,
			titleTemplate: bundle.siteSettings.titleTemplate,
			defaultOgImageUrl: bundle.siteSettings.defaultOgImageUrl,
			googleSiteVerification: bundle.siteSettings.googleSiteVerification,
			seo: bundle.siteSettings.seo,
		};
		const settings = siteSettingsSchema.parse({
			...parsed.data,
			seo: parsed.data.seo,
		});
		await saveGlobalSeoSettings(settings);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać SEO. Spróbuj ponownie." };
	}

	const publishMedia = mediaUrlsChanged(previous, parsed.data);
	const rev = await revalidateContentCache(["/"], { publishMedia });
	return { ok: true, error: null, mediaPublishQueued: rev.mediaPublishQueued };
}

export async function savePageSeoAction(
	pageId: string,
	seo: SeoMeta,
	path: string,
): Promise<SaveSeoState> {
	const parsed = seoFieldsSchema.safeParse(seo);
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Błędne dane SEO." };
	}

	let previous: SeoMeta | undefined;
	try {
		const bundle = await getSeoSettingsBundle();
		previous = bundle.pageSeo[pageId as keyof typeof bundle.pageSeo];
		await savePageSeo(pageId, parsed.data);
	} catch (error) {
		if (error instanceof AdminUnauthorizedError) redirect(`${magazynConfig.basePath}/login`);
		if (error instanceof AdminApiError) return { ok: false, error: error.message };
		return { ok: false, error: "Nie udało się zapisać SEO podstrony." };
	}

	const publishMedia = mediaUrlsChanged(previous ?? {}, parsed.data);
	const rev = await revalidateContentCache([path], { publishMedia });
	return { ok: true, error: null, mediaPublishQueued: rev.mediaPublishQueued };
}
