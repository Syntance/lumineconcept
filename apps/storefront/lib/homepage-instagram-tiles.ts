import type { GlobalContent } from "@/lib/content/types";

/** Kafelek siatki IG na HP — źródło: Magazyn CMS (`instagramTiles`). */
export type HomepageInstagramTile = {
  id: string;
  permalink: string;
  imageUrl: string;
  alt: string;
};

const DEFAULT_ALT = "Lumine Concept na Instagramie";

export function homepageInstagramTilesFromGlobal(global: GlobalContent): HomepageInstagramTile[] {
  const rows = global.instagramTiles;
  if (!rows?.length) return [];

  const out: HomepageInstagramTile[] = [];
  for (const row of rows) {
    if (!row.imageUrl || !row.postUrl) continue;
    out.push({
      id: row.id,
      permalink: row.postUrl,
      imageUrl: row.imageUrl,
      alt: row.alt?.trim() || DEFAULT_ALT,
    });
    if (out.length >= 6) break;
  }
  return out;
}
