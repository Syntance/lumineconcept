import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { revalidateStorefrontMedusaCache } from "@magazyn/core/lib/revalidate-storefront";
import { MAGAZYN_CONTENT_CACHE_TAG } from "@/lib/content/metadata-keys";

export async function revalidateContentCache(paths: string[] = []): Promise<void> {
	revalidateTag(MAGAZYN_CONTENT_CACHE_TAG, "max");
	revalidateTag("site-settings", "max");
	await revalidateStorefrontMedusaCache([MAGAZYN_CONTENT_CACHE_TAG, "site-settings"]);
	for (const path of paths) {
		if (path) revalidatePath(path);
	}
}
