import { medusa } from "./client";

const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID;

if (!REGION_ID && typeof window === "undefined") {
  console.warn(
    "[Medusa] NEXT_PUBLIC_MEDUSA_REGION_ID is not set — product prices may not display correctly.",
  );
}

export async function getProducts(params?: {
  limit?: number;
  offset?: number;
  category_id?: string[];
  order?: string;
}) {
  const response = await medusa.store.product.list({
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    category_id: params?.category_id,
    order: params?.order,
    region_id: REGION_ID,
    fields: "+variants.calculated_price",
  });

  return response;
}

export async function getProductByHandle(handle: string) {
  const response = await medusa.store.product.list({
    handle,
    fields: "+variants.calculated_price,+variants.inventory_quantity",
  });

  return response.products[0] ?? null;
}

/**
 * Returns products tagged with `tag` (case-insensitive).
 * Fetches a broader set and filters in memory — appropriate for small catalogs.
 */
export async function getProductsByTag(tag: string, limit = 6) {
  const response = await medusa.store.product.list({
    limit: 100,
    region_id: REGION_ID,
    fields: "+variants.calculated_price,+tags",
  });

  const normalised = tag.toLowerCase();
  const filtered = response.products.filter((p) =>
    p.tags?.some((t) => t.value?.toLowerCase() === normalised),
  );

  return filtered.slice(0, limit);
}

export async function getProductCategories() {
  const response = await medusa.store.category.list({
    include_descendants_tree: true,
  });

  return response.product_categories;
}
