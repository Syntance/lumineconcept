import { unstable_cache } from "next/cache";
import { medusa } from "./client";
import { getPolishRegionId } from "./region";

function logMedusaFailure(context: string, error: unknown) {
  console.error(
    `[medusa] ${context} — backend niedostępny lub błąd HTTP (np. 502). Uruchom Medusę (pnpm dev w apps/backend) i sprawdź NEXT_PUBLIC_MEDUSA_BACKEND_URL.`,
    error,
  );
}

async function _getProducts(params?: {
  limit?: number;
  offset?: number;
  category_id?: string[];
  order?: string;
}) {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  try {
    const regionId = await getPolishRegionId();
    return await medusa.store.product.list({
      limit,
      offset,
      category_id: params?.category_id,
      order: params?.order,
      region_id: regionId,
      fields:
        "+variants.calculated_price,+variants.metadata,+options,+tags,*images,+thumbnail,+metadata",
    });
  } catch (e) {
    logMedusaFailure("getProducts", e);
    return { products: [], count: 0, offset, limit };
  }
}

export const getProducts = unstable_cache(
  _getProducts,
  ["medusa-products"],
  { revalidate: 60, tags: ["medusa-products"] },
);

async function _getProductByHandle(handle: string) {
  try {
    const regionId = await getPolishRegionId();
    const response = await medusa.store.product.list({
      handle,
      region_id: regionId,
      fields:
        "+variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.metadata,*images,+thumbnail,+metadata,+options",
    });

    return response.products[0] ?? null;
  } catch (e) {
    logMedusaFailure(`getProductByHandle(${handle})`, e);
    return null;
  }
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
  try {
    const regionId = await getPolishRegionId();
    const fetchLimit = Math.max(limit * 3, 20);
    const response = await medusa.store.product.list({
      limit: fetchLimit,
      region_id: regionId,
      fields: "+variants.calculated_price,+variants.metadata,+tags,*images,+thumbnail,+metadata",
    });

    const normalised = tag.toLowerCase();
    const tagged = response.products.filter((p) =>
      p.tags?.some((t) => t.value?.toLowerCase() === normalised),
    );

    const result = tagged.length > 0 ? tagged : response.products;
    return result.slice(0, limit);
  } catch (e) {
    logMedusaFailure(`getProductsByTag(${tag})`, e);
    return [];
  }
}

async function _getProductCategories() {
  try {
    const response = await medusa.store.category.list({
      include_descendants_tree: true,
    });

    return response.product_categories;
  } catch (e) {
    logMedusaFailure("getProductCategories", e);
    return [];
  }
}

export const getProductCategories = unstable_cache(
  _getProductCategories,
  ["medusa-categories"],
  { revalidate: 300, tags: ["medusa-categories"] },
);
