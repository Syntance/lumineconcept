import { medusa } from "./client";

const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ?? "reg_01KMB8M6SRF1HNR7FN34FGNJ7V";

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

export async function getProductsByTag(_tag: string, limit = 6) {
  const response = await getProducts({ limit });
  return response.products;
}

export async function getProductCategories() {
  const response = await medusa.store.category.list({
    include_descendants_tree: true,
  });

  return response.product_categories;
}
