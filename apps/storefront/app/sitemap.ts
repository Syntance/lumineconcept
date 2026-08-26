import type { MetadataRoute } from "next";
import {
  collectIndexableProducts,
  collectListingCategoryPaths,
} from "@/lib/seo/indexable-urls";
import { SITE_URL } from "@/lib/utils";

/** ISR — nowe/zmienione produkty trafiają do sitemap.xml bez redeploya. */
export const revalidate = 3600;

/** Strony stałe — ścieżka → parametry wpisu. Kolejność = kolejność w XML. */
const STATIC_ENTRIES: ReadonlyArray<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/sklep", changeFrequency: "daily", priority: 0.9 },
  { path: "/sklep/gotowe-wzory", changeFrequency: "daily", priority: 0.85 },
  { path: "/sklep/tablice-z-logo", changeFrequency: "daily", priority: 0.85 },
  { path: "/sklep/certyfikaty", changeFrequency: "daily", priority: 0.85 },
  // Strony informacyjne / prawne (indeksowalne). `salony-beauty` jest `noindex` (w budowie).
  { path: "/o-nas", changeFrequency: "monthly", priority: 0.65 },
  { path: "/kontakt", changeFrequency: "monthly", priority: 0.6 },
  { path: "/dostawa-i-platnosci", changeFrequency: "monthly", priority: 0.6 },
  { path: "/zwroty", changeFrequency: "yearly", priority: 0.4 },
  { path: "/regulamin", changeFrequency: "yearly", priority: 0.3 },
  { path: "/polityka-prywatnosci", changeFrequency: "yearly", priority: 0.3 },
  { path: "/deklaracja-dostepnosci", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Równolegle — obie listy idą do Medusy, a sitemap i tak czeka na obie.
  const [products, listingPaths] = await Promise.all([
    collectIndexableProducts(),
    collectListingCategoryPaths(),
  ]);

  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  const push = (entry: MetadataRoute.Sitemap[number]) => {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  };

  for (const { path, changeFrequency, priority } of STATIC_ENTRIES) {
    push({ url: `${SITE_URL}${path}`, changeFrequency, priority, lastModified: now });
  }

  // Listingi podkategorii, np. `/sklep/gotowe-wzory/cenniki` — własne strony
  // z osobnym canonicalem, więc bez nich Google musi je odkryć tylko z linków.
  for (const path of listingPaths) {
    push({
      url: `${SITE_URL}${path}`,
      changeFrequency: "daily",
      priority: 0.8,
      lastModified: now,
    });
  }

  for (const product of products) {
    push({
      url: `${SITE_URL}${product.path}`,
      lastModified: product.lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
