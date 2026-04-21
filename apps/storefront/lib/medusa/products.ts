import { unstable_cache } from "next/cache";
import { medusa } from "./client";
import { getPolishRegionId } from "./region";

function logMedusaFailure(context: string, error: unknown) {
  const msg = `[medusa] ${context} — backend niedostępny lub błąd HTTP (np. 502). Uruchom Medusę (apps/backend) i sprawdź MEDUSA_BACKEND_URL / NEXT_PUBLIC_MEDUSA_REGION_ID.`;
  if (process.env.NODE_ENV === "development") {
    console.warn(msg, error);
  } else {
    console.error(msg, error);
  }
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

/**
 * WAŻNE: nie łapiemy tu błędu i nie zwracamy null przy rzucie.
 * `unstable_cache` cache'uje wartości zwrotne (w tym null!) na `revalidate`
 * sekund — jeśli złapiemy timeout Railway/cold start i zwrócimy null,
 * produkt będzie dawać 404 przez 120s, dopóki cache nie wygaśnie. Rzucony
 * błąd natomiast NIE jest cache'owany, więc następny request spróbuje
 * ponownie. Brak produktu (response.products jest pusty) zwraca null i
 * ten null jest poprawnie zacache'owany.
 */
async function _getProductByHandle(handle: string) {
  const regionId = await getPolishRegionId();

  /**
   * Railway (Neon + Medusa v2) przy cold starcie potrafi timeoutować
   * pierwszy request — dajemy jedną szybką retry zanim propagujemy błąd.
   */
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1200));
    }
    try {
      const response = await medusa.store.product.list({
        handle,
        region_id: regionId,
        fields:
          "+variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.metadata,*images,+thumbnail,+metadata,+options",
      });
      return response.products[0] ?? null;
    } catch (e) {
      lastErr = e;
    }
  }

  logMedusaFailure(`getProductByHandle(${handle})`, lastErr);
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`getProductByHandle(${handle}) failed`);
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
