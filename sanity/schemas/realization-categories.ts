/**
 * Podstrony sklepu, na których widać sekcję „realizacje”.
 * W Studio: Treści → Realizacje → jedna pozycja = jedna podstrona (tylko zdjęcia).
 */
export const REALIZATION_PAGES = [
  { value: "tablica-z-logo", title: "Tablice z logo", path: "/sklep/logo-3d" },
  { value: "tla-do-tablic", title: "Tła do tablic", path: "/sklep/tla-do-tablic" },
  { value: "gotowe-wzory", title: "Gotowe wzory", path: "/sklep/gotowe-wzory" },
  { value: "tablice-cenowe", title: "Tablice cenowe", path: "/sklep/tablice-cenowe" },
  { value: "inne", title: "Pozostałe w sklepie", path: "/sklep" },
] as const;

export type RealizationPageValue = (typeof REALIZATION_PAGES)[number]["value"];

export type RealizationCategoryValue = RealizationPageValue;

/** Alias nazwy — to sama lista co REALIZATION_PAGES (np. dla importów) */
export const REALIZATION_CATEGORIES = REALIZATION_PAGES;
