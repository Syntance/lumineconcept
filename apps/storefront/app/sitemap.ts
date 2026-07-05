import type { MetadataRoute } from "next";
import { medusa } from "@/lib/medusa/client";
import { SITE_URL } from "@/lib/utils";
import { canonicalProductPath, productTagValues } from "@/lib/products/product-canonical";

/** Ile produktów pobieramy na stronę przy paginacji listy. */
const PRODUCTS_PAGE_SIZE = 200;
/** Twardy limit bezpieczeństwa, gdyby `count` był niewiarygodny. */
const MAX_PRODUCT_PAGES = 100;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0, lastModified: now },
    { url: `${SITE_URL}/sklep`, changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: `${SITE_URL}/sklep/gotowe-wzory`, changeFrequency: "daily", priority: 0.85, lastModified: now },
    { url: `${SITE_URL}/sklep/tablice-z-logo`, changeFrequency: "daily", priority: 0.85, lastModified: now },
    { url: `${SITE_URL}/sklep/certyfikaty`, changeFrequency: "daily", priority: 0.85, lastModified: now },
    // Strony informacyjne / prawne (indeksowalne). `salony-beauty` jest `noindex` (w budowie).
    { url: `${SITE_URL}/o-nas`, changeFrequency: "monthly", priority: 0.65, lastModified: now },
    { url: `${SITE_URL}/kontakt`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${SITE_URL}/dostawa-i-platnosci`, changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: `${SITE_URL}/zwroty`, changeFrequency: "yearly", priority: 0.4, lastModified: now },
    { url: `${SITE_URL}/regulamin`, changeFrequency: "yearly", priority: 0.3, lastModified: now },
    { url: `${SITE_URL}/polityka-prywatnosci`, changeFrequency: "yearly", priority: 0.3, lastModified: now },
    { url: `${SITE_URL}/deklaracja-dostepnosci`, changeFrequency: "yearly", priority: 0.3, lastModified: now },
  ];

  const productPages = await collectProductPages();
  return [...staticPages, ...productPages];
}

async function collectProductPages(): Promise<MetadataRoute.Sitemap> {
  const seen = new Set<string>();
  const pages: MetadataRoute.Sitemap = [];

  try {
    for (let page = 0; page < MAX_PRODUCT_PAGES; page++) {
      const offset = page * PRODUCTS_PAGE_SIZE;
      const { products, count } = await medusa.store.product.list({
        limit: PRODUCTS_PAGE_SIZE,
        offset,
      });

      for (const product of products) {
        if (!product.handle || seen.has(product.handle)) continue;
        seen.add(product.handle);

        // Jeden kanoniczny URL na produkt — bez duplikatów ścieżek kategorii.
        const path = canonicalProductPath(product.handle, productTagValues(product));
        pages.push({
          url: `${SITE_URL}${path}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }

      const fetched = offset + products.length;
      if (products.length === 0 || (typeof count === "number" && fetched >= count)) {
        break;
      }
    }
  } catch {
    // Medusa niedostępna podczas builda — zwracamy to, co zebrane (może być puste).
  }

  return pages;
}
