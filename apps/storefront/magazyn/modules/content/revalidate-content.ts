import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateStorefrontMedusaCache } from "@magazyn/core/lib/revalidate-storefront";
import { triggerVercelDeploy } from "@magazyn/core/lib/trigger-vercel-deploy";
import { MAGAZYN_CONTENT_CACHE_TAG } from "@/lib/content/metadata-keys";

export async function revalidateContentCache(paths: string[] = []): Promise<void> {
	revalidateTag(MAGAZYN_CONTENT_CACHE_TAG, "max");
	revalidateTag("site-settings", "max");
	await revalidateStorefrontMedusaCache([MAGAZYN_CONTENT_CACHE_TAG, "site-settings"]);
	for (const path of paths) {
		if (path) revalidatePath(path);
	}

	/**
	 * Auto-deploy: po zapisie CMS odpalamy produkcyjny build na Vercel.
	 * `prebuild` ściągnie świeży CMS → static files → instant load na prod.
	 * No-op gdy `VERCEL_DEPLOY_HOOK_URL` nie jest ustawiony (np. dev/preview).
	 */
	await triggerVercelDeploy(`CMS save: ${paths.join(", ") || "global"}`);
}
