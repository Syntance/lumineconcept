import { unstable_cache } from "next/cache";
import { medusa } from "./client";
import { getPolishRegionId } from "./region";

async function _getProducts(params?: {
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
    fields: "+variants.calculated_price,+options,+tags,*images,+thumbnail",
  });

  return response;
}

export const getProducts = unstable_cache(
  _getProducts,
  ["medusa-products"],
  { revalidate: 60, tags: ["medusa-products"] },
);

async function _getProductByHandle(handle: string) {
  const regionId = await getPolishRegionId();
  const response = await medusa.store.product.list({
    handle,
    region_id: regionId,
    fields:
      "+variants.calculated_price,+variants.inventory_quantity,*images,+thumbnail",
  });

  return response.products[0] ?? null;
}

export const getProductByHandle = unstable_cache(
  _getProductByHandle,
  ["medusa-product-by-handle"],
  { revalidate: 120, tags: ["medusa-products"] },
);

/**
 * Returns products tagged with `tag` (case-insensitive).
 * Falls back to the first `limit` products if none are tagged.
 */
export async function getProductsByTag(tag: string, limit = 6) {
  const regionId = await getPolishRegionId();
  const fetchLimit = Math.max(limit * 3, 20);
  const response = await medusa.store.product.list({
    limit: fetchLimit,
    region_id: regionId,
    fields: "+variants.calculated_price,+tags,*images,+thumbnail",
  });

  const normalised = tag.toLowerCase();
  const tagged = response.products.filter((p) =>
    p.tags?.some((t) => t.value?.toLowerCase() === normalised),
  );

  const result = tagged.length > 0 ? tagged : response.products;
  return result.slice(0, limit);
}

async function _getProductCategories() {
  const response = await medusa.store.category.list({
    include_descendants_tree: true,
  });

  return response.product_categories;
}

export const getProductCategories = unstable_cache(
  _getProductCategories,
  ["medusa-categories"],
  { revalidate: 300, tags: ["medusa-categories"] },
);
