/**
 * Jedyna podstrona sklepu, na której front pokazuje galerię realizacji z Sanity.
 * W Studio: Treści → Realizacje → edycja zdjęć.
 */
export const REALIZATION_GALLERY_PAGE = {
  value: "tablica-z-logo",
  title: "Tablice z logo",
  path: "/sklep/logo-3d",
} as const;

export type RealizationPageValue = (typeof REALIZATION_GALLERY_PAGE)["value"];

export type RealizationCategoryValue = RealizationPageValue;

/** Zgodność wsteczna — jeden wpis */
export const REALIZATION_PAGES = [REALIZATION_GALLERY_PAGE] as const;
export const REALIZATION_CATEGORIES = REALIZATION_PAGES;
