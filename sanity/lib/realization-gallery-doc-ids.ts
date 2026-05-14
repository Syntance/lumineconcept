import type { RealizationCategoryValue } from "../schemas/realization-categories";

/** Jedna „galeria” na kategorię — stałe ID dokumentów (singleton w Structure). */
export const REALIZATION_GALLERY_DOC_ID: Record<RealizationCategoryValue, string> = {
  "tablica-z-logo": "realization-gallery-tablica-z-logo",
  "tla-do-tablic": "realization-gallery-tla-do-tablic",
  "gotowe-wzory": "realization-gallery-gotowe-wzory",
  "tablice-cenowe": "realization-gallery-tablice-cenowe",
  inne: "realization-gallery-inne",
};
