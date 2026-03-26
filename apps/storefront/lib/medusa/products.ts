import { medusa } from "./client";

let cachedRegionId: string | null = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? null;

async function getRegionId(): Promise<string> {
  if (cachedRegionId) return cachedRegionId;

  const response = await medusa.store.region.list();
  const plRegion = response.regions.find(
    (r) => r.countries?.some((c) => c.iso_2 === "pl"),
  );

  if (!plRegion) {
    throw new Error("Region PL nie znaleziony. Skonfiguruj region w Medusa Admin.");
  }

  cachedRegionId = plRegion.id;
  return cachedRegionId;
}

export async function getProducts(params?: {
  limit?: number;
  offset?: number;
  category_id?: string[];
  order?: string;
}) {
  const regionId = await getRegionId();
  const response = await medusa.store.product.list({
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    category_id: params?.category_id,
    order: params?.order,
    region_id: regionId,
    fields: "+variants.calculated_price",
  });

  return response;
}

export async function getProductByHandle(handle: string) {
  const regionId = await getRegionId();
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
  const regionId = await getRegionId();
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
