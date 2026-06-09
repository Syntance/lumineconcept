import { searchProducts } from "@/lib/meilisearch/client";
import type { SimpleProduct } from "./simple-product";

export const MIN_PRODUCT_SEARCH_LENGTH = 2;
const MEILI_SEARCH_LIMIT = 500;

export function isSearchQueryActive(query: string | undefined): boolean {
	return (query?.trim().length ?? 0) >= MIN_PRODUCT_SEARCH_LENGTH;
}

/** Zwraca posortowane ID z Meili albo `"fallback"` gdy brak klucza / błąd API. */
export async function resolveSearchProductIds(
	query: string,
): Promise<string[] | "fallback"> {
	const q = query.trim();
	if (!isSearchQueryActive(q)) return [];

	if (!process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY?.trim()) {
		return "fallback";
	}

	try {
		const response = await searchProducts(q, { limit: MEILI_SEARCH_LIMIT });
		return (response.hits as Array<{ id: string }>).map((hit) => hit.id);
	} catch (err) {
		console.error("[product-search] Meilisearch failed — text fallback", err);
		return "fallback";
	}
}

export function productMatchesTextQuery(product: SimpleProduct, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (!isSearchQueryActive(q)) return true;
	const haystack = [product.title, product.handle, product.description ?? ""]
		.join(" ")
		.toLowerCase();
	return haystack.includes(q);
}

export function orderProductsBySearchIds(
	products: SimpleProduct[],
	searchIds: string[],
): SimpleProduct[] {
	const rank = new Map(searchIds.map((id, index) => [id, index]));
	return products
		.filter((product) => rank.has(product.id))
		.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
}

export function filterProductsBySearch(
	products: SimpleProduct[],
	query: string | undefined,
	searchIds: string[] | "fallback",
): SimpleProduct[] {
	if (!isSearchQueryActive(query)) return products;
	const q = query!.trim();

	if (searchIds === "fallback") {
		return products.filter((product) => productMatchesTextQuery(product, q));
	}

	if (searchIds.length === 0) return [];
	return orderProductsBySearchIds(products, searchIds);
}
