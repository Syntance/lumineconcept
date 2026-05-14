/**
 * Wspólny enum stron, do których przypinamy treści CMS-owe (FAQ, opinie itd.).
 * Dzięki temu w Studio można pogrupować dokumenty według strony.
 *
 * Wartości to identyfikatory stabilne — nie zmieniaj `value` bez migracji,
 * bo na froncie filtrujemy po nich w GROQ.
 */
export const PAGE_CONTEXTS = [
  { value: "home", title: "Strona główna" },
  { value: "shop", title: "Sklep — strona główna" },
  { value: "logo-3d", title: "Sklep — Tablica z logo" },
  { value: "gotowe-wzory", title: "Sklep — Gotowe wzory" },
  { value: "tla-do-tablic", title: "Sklep — Tła do tablic" },
  { value: "tablice-cenowe", title: "Sklep — Tablice cenowe" },
  { value: "global", title: "Globalnie (wszystkie strony)" },
] as const;

export type PageContextValue = (typeof PAGE_CONTEXTS)[number]["value"];

export const PAGE_CONTEXT_OPTIONS = PAGE_CONTEXTS.map(({ value, title }) => ({ value, title }));
