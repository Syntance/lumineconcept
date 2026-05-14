/**
 * Stałe ID dokumentu galerii realizacji (singleton w Studio).
 * Musi być zgodny z `sanity/lib/realization-gallery-doc-ids.ts`.
 */
export const REALIZATION_GALLERY_DOC_IDS = {
  "tablica-z-logo": "realization-gallery-tablica-z-logo",
} as const;

export type RealizationGalleryDocKey = keyof typeof REALIZATION_GALLERY_DOC_IDS;

export function revalidatePathForRealizationGalleryDoc(_id: string): string | null {
  const stripped = _id.replace(/^drafts\./, "");
  if (stripped === REALIZATION_GALLERY_DOC_IDS["tablica-z-logo"]) {
    return "/sklep/logo-3d";
  }
  return null;
}
