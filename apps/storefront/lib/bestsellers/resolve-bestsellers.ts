import type { BestsellersContent } from "@/lib/content/types";
import { getProductsByIds, getProductsByTag } from "@/lib/medusa/products";

export const BESTSELLERS_DEFAULT_TITLE = "Bestsellery";
export const BESTSELLERS_DISPLAY_LIMIT = 4;

export async function resolveBestsellerProducts(config?: BestsellersContent) {
	const ids = config?.productIds?.filter((id) => id.trim().length > 0) ?? [];
	if (ids.length > 0) {
		const products = await getProductsByIds(ids);
		return products.slice(0, BESTSELLERS_DISPLAY_LIMIT);
	}
	return getProductsByTag("bestseller", BESTSELLERS_DISPLAY_LIMIT);
}

export function resolveBestsellersTitle(config?: BestsellersContent): string {
	const title = config?.title?.trim();
	return title && title.length > 0 ? title : BESTSELLERS_DEFAULT_TITLE;
}
