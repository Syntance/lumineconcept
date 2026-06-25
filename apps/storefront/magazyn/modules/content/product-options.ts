import "server-only";

import { adminFetch } from "@magazyn/core/medusa/client";

export type CmsProductOption = {
	id: string;
	title: string;
	handle: string;
	thumbnail: string | null;
};

/** Produkty do pickera CMS (bestsellery) — tylko opublikowane. */
export async function listProductOptionsForCms(): Promise<CmsProductOption[]> {
	const params = new URLSearchParams({
		limit: "200",
		fields: "id,title,handle,thumbnail",
		order: "title",
	});
	params.append("status[]", "published");

	const data = await adminFetch<{
		products: Array<{ id: string; title: string; handle: string; thumbnail?: string | null }>;
	}>(`/admin/products?${params.toString()}`);

	return (data.products ?? []).map((product) => ({
		id: product.id,
		title: product.title,
		handle: product.handle,
		thumbnail: product.thumbnail ?? null,
	}));
}
