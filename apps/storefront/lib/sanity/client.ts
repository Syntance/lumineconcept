import { cache } from "react";
import { createClient } from "next-sanity";
import { SITE_SETTINGS_QUERY } from "./queries";
import type { SiteSettings } from "./types";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-03-22",
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN,
});

export const cachedSanityFetch = cache(
  <T>(query: string, params?: Record<string, string>): Promise<T> =>
    sanityClient.fetch<T>(query, params ?? {}),
);

/**
 * Jeden, wspólny helper do pobierania `siteSettings` z Sanity.
 * Wcześniej każda strona (layout, strona główna, sklep, PDP…) miała własne
 * `sanityClient.fetch(SITE_SETTINGS_QUERY, …)` z różnymi wartościami
 * `revalidate` i bez spójnych tagów. Efekt: renderowanie jednej strony
 * mogło odpytać Sanity o to samo 3×, a webhook z Sanity nie miał jednego
 * tagu do inwalidacji.
 *
 * `cache` z Reacta dedupuje zapytania wewnątrz jednego renderu,
 * `unstable_cache`-owy `tags: ["sanity", "site-settings"]` pozwala
 * przebić się webhookowi `/api/revalidate`.
 */
export const getSiteSettings = cache(
  async (): Promise<SiteSettings | null> => {
    try {
      return await sanityClient.fetch<SiteSettings>(
        SITE_SETTINGS_QUERY,
        {},
        { next: { revalidate: 300, tags: ["sanity", "site-settings"] } },
      );
    } catch {
      return null;
    }
  },
);
