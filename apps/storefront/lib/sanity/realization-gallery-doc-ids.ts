/**
 * Stałe ID dokumentów galerii (singleton w Studio).
 * Muszą być zgodne z `sanity/lib/realization-gallery-doc-ids.ts`.
 */
export const REALIZATION_GALLERY_DOC_IDS = {
  "tablica-z-logo": "realization-gallery-tablica-z-logo",
  "tla-do-tablic": "realization-gallery-tla-do-tablic",
  "gotowe-wzory": "realization-gallery-gotowe-wzory",
  "tablice-cenowe": "realization-gallery-tablice-cenowe",
  inne: "realization-gallery-inne",
} as const;

export type RealizationGalleryDocKey = keyof typeof REALIZATION_GALLERY_DOC_IDS;

export function revalidatePathForRealizationGalleryDoc(_id: string): string | null {
  const stripped = _id.replace(/^drafts\./, "");
  const byId: Record<string, string> = {
    [REALIZATION_GALLERY_DOC_IDS["tablica-z-logo"]]: "/sklep/logo-3d",
    [REALIZATION_GALLERY_DOC_IDS["tla-do-tablic"]]: "/sklep/tla-do-tablic",
    [REALIZATION_GALLERY_DOC_IDS["gotowe-wzory"]]: "/sklep/gotowe-wzory",
    [REALIZATION_GALLERY_DOC_IDS["tablice-cenowe"]]: "/sklep/tablice-cenowe",
    [REALIZATION_GALLERY_DOC_IDS.inne]: "/sklep",
  };
  return byId[stripped] ?? null;
}
