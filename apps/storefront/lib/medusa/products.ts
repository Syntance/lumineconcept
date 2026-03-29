import { medusa } from "./client";
import { getPolishRegionId } from "./region";

export async function getProducts(params?: {
  limit?: number;
  offset?: number;
  category_id?: string[];
  order?: string;
}) {
  const regionId = await getPolishRegionId();
  const response = await medusa.store.product.list({
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    category_id: params?.category_id,
    order: params?.order,
    region_id: regionId,
    fields: "+variants.calculated_price,+options,+tags",
  });

  return response;
}

export async function getProductByHandle(handle: string) {
  const regionId = await getPolishRegionId();
  const response = await medusa.store.product.list({
    handle,
    region_id: regionId,
    fields: "+variants.calculated_price,+variants.inventory_quantity",
  });

  return response.products[0] ?? null;
}

/**
 * Returns products tagged with `tag` (case-insensitive).
 * Falls back to the first `limit` products if none are tagged.
 */
export async function getProductsByTag(tag: string, limit = 6) {
  const regionId = await getPolishRegionId();
  const response = await medusa.store.product.list({
    limit: 100,
    region_id: regionId,
    fields: "+variants.calculated_price,+tags",
  });

  const normalised = tag.toLowerCase();
  const tagged = response.products.filter((p) =>
    p.tags?.some((t) => t.value?.toLowerCase() === normalised),
  );

  // If no products have the tag yet, show the first available products
  const result = tagged.length > 0 ? tagged : response.products;
  return result.slice(0, limit);
}

export async function getProductCategories() {
  const response = await medusa.store.category.list({
    include_descendants_tree: true,
  });

  return response.product_categories;
}
