import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateStorefrontMedusaCache } from "@magazyn/core/lib/revalidate-storefront";
import { triggerVercelDeploy } from "@magazyn/core/lib/trigger-vercel-deploy";
import { MAGAZYN_CONTENT_CACHE_TAG } from "@/lib/content/metadata-keys";

export type RevalidateContentOptions = {
	/** Uruchom deploy hook → prebuild sync obrazów do `/public/images/cms/`. */
	publishMedia?: boolean;
};

export type RevalidateContentResult = {
	/** Tekst/SEO odświeżone tagiem (live na prod w sekundach). */
	live: true;
	/** Deploy hook wysłany — obrazy zostaną zlokalizowane po buildzie. */
	mediaPublishQueued: boolean;
};

/**
 * Rewalidacja CMS (hybrid):
 * - zawsze: tag + webhook (tekst live),
 * - opcjonalnie: deploy hook tylko gdy zmieniono media (prebuild sync obrazów).
 */
export async function revalidateContentCache(
	paths: string[] = [],
	options: RevalidateContentOptions = {},
): Promise<RevalidateContentResult> {
	revalidateTag(MAGAZYN_CONTENT_CACHE_TAG, "max");
	revalidateTag("site-settings", "max");
	await revalidateStorefrontMedusaCache([MAGAZYN_CONTENT_CACHE_TAG, "site-settings"]);
	for (const path of paths) {
		if (path) revalidatePath(path);
	}

	let mediaPublishQueued = false;
	if (options.publishMedia) {
		await triggerVercelDeploy(`CMS media: ${paths.join(", ") || "global"}`);
		mediaPublishQueued = Boolean(process.env.VERCEL_DEPLOY_HOOK_URL?.trim());
	}

	return { live: true, mediaPublishQueued };
}

/** Po uploadzie obrazu w panelu — kolejkuje prebuild sync (bez czekania na Save formularza). */
export async function queueCmsMediaPublish(reason = "CMS image upload"): Promise<boolean> {
	await triggerVercelDeploy(reason);
	return Boolean(process.env.VERCEL_DEPLOY_HOOK_URL?.trim());
}
