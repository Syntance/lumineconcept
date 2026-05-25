import type { SiteSettings } from "@/lib/sanity/types";

/** Kafelek siatki IG na HP — źródło: Sanity (`homepageInstagramPosts`). */
export type HomepageInstagramTile = {
  id: string;
  permalink: string;
  imageUrl: string;
  alt: string;
};

const DEFAULT_ALT = "Lumine Concept na Instagramie";

/**
 * Mapuje wpisy z ustawień strony na kolejność wyświetlania (max. 6).
 * Pomija niekompletne elementy (brak URL lub obrazka).
 */
export function homepageInstagramTilesFromSettings(
  settings: SiteSettings | null,
): HomepageInstagramTile[] {
  const rows = settings?.homepageInstagramPosts;
  if (!rows?.length) return [];

  const out: HomepageInstagramTile[] = [];
  for (const row of rows) {
    const url = row.image?.asset?.url;
    if (!url || !row.postUrl) continue;
    out.push({
      id: row._key,
      permalink: row.postUrl,
      imageUrl: url,
      alt: row.alt?.trim() || DEFAULT_ALT,
    });
    if (out.length >= 6) break;
  }
  return out;
}
