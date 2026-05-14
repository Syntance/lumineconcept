export interface FilterConfig {
  sizes: string[];
  materials: string[];
  finishes: string[];
  hasLed: boolean;
  minPrice: number;
  maxPrice: number;
}

export interface ActiveFilters {
  category?: string;
  pill?: string;
  sort: string;
  led?: boolean;
  priceMin?: number;
  priceMax?: number;
  sizes: string[];
  materials: string[];
  finishes: string[];
}

export const PRODUCT_PILLS = [
  { value: "all", label: "Wszystkie" },
  { value: "cenniki", label: "Cenniki" },
  { value: "tabliczki", label: "Tabliczki" },
  { value: "menu", label: "Menu" },
  { value: "qr", label: "QR" },
  { value: "wizytowniki", label: "Wizytowniki" },
  { value: "certyfikaty", label: "Certyfikaty" },
] as const;

export function matchesPill(pill: string | undefined, handle: string, title: string): boolean {
  if (!pill || pill === "all") return true;
  const h = handle.toLowerCase();
  const t = title.toLowerCase();
  switch (pill) {
    case "cenniki":
      return h.includes("cennik");
    case "tabliczki":
      return (
        h.includes("tabliczk") ||
        h.includes("piktogram") ||
        h.includes("zakaz") ||
        h.includes("instrukcja-mycia") ||
        h.includes("higiena") ||
        h.includes("zaleceni") ||
        h.includes("pielegnac") ||
        h.includes("pomieszczen") ||
        h.includes("informacyjn")
      );
    case "menu":
      return h.includes("menu") || h.includes("drink");
    case "qr":
      return h.includes("qr") || h.includes("wifi") || h.includes("wi-fi");
    case "wizytowniki":
      return h.includes("wizytownik");
    case "certyfikaty":
      return (
        h.includes("certyfikat") ||
        h.includes("dyplom") ||
        h.includes("voucher") ||
        h.includes("podziękow") ||
        h.includes("podziekow") ||
        t.includes("certyfikat") ||
        t.includes("dyplom") ||
        t.includes("voucher")
      );
    default:
      return true;
  }
}

export const SORT_OPTIONS = [
  { value: "-created_at", label: "Najnowsze" },
  { value: "created_at", label: "Najstarsze" },
  { value: "price_asc", label: "Cena: od najniższej" },
  { value: "price_desc", label: "Cena: od najwyższej" },
  { value: "title", label: "Nazwa A-Z" },
  { value: "-title", label: "Nazwa Z-A" },
] as const;

export function isPriceSort(sort: string): boolean {
  return sort === "price_asc" || sort === "price_desc";
}

/**
 * Medusa v2: kwoty w PLN decimal (nie groszach). Slider operuje na pełnych
 * złotówkach — wygodny krok 10 zł, zakres 0–1000 zł pokrywa cały asortyment.
 */
export const PRICE_STEP = 10;
export const PRICE_SLIDER_MIN = 0;
export const PRICE_SLIDER_MAX = 1000;

/**
 * Suwak ceny: pełna szerokość jak wiersz z kwotami (`justify-between`); kropki od krawędzi tekstu.
 */
export const PRICE_RANGE_ROW_CLASS = "relative h-7 w-full min-w-0";

/** Wewnątrz `PRICE_RANGE_ROW_CLASS` — wspólny układ dla inputów i tła paska. */
export const PRICE_RANGE_INNER_CLASS = "relative h-full w-full";

/**
 * Natywny `<input type="range">` (WebKit + Firefox): pełna szerokość toru, większy thumb.
 */
export const PRICE_RANGE_INPUT_CLASS = [
  "pointer-events-none absolute inset-0 w-full m-0 p-0 max-w-none appearance-none bg-transparent",
  "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:rounded-full",
  "[&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-runnable-track]:[box-shadow:none]",
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
  "[&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white",
  "[&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-md",
  "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:w-full [&::-moz-range-track]:rounded-full",
  "[&::-moz-range-track]:bg-transparent [&::-moz-range-track]:border-0",
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5",
  "[&::-moz-range-thumb]:box-border [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-500 [&::-moz-range-thumb]:shadow-none",
].join(" ");

export const PRICE_RANGE_TRACK_IDLE_CLASS =
  "pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-500/25";

export const PRICE_RANGE_TRACK_ACTIVE_CLASS =
  "pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-500";

export const PRICE_RANGE_THUMB_RADIUS_PX = 10;

/**
 * Pasek „zakresu” między kółkami: od prawej krawędzi lewego thumb do lewej krawędzi prawego,
 * zgodnie z `calc` na szerokości wewnętrznej (bez brązowego „wystającego” poza kropki).
 */
export function priceRangeActiveTrackStyle(args: {
  localMin: number;
  localMax: number;
  sliderMin: number;
  sliderMax: number;
}): { left: string; right: string } {
  const { localMin, localMax, sliderMin, sliderMax } = args;
  const span = sliderMax - sliderMin;
  const r = PRICE_RANGE_THUMB_RADIUS_PX;
  if (span <= 0) {
    return { left: `${r}px`, right: `${r}px` };
  }
  const f1 = (localMin - sliderMin) / span;
  const f2 = (localMax - sliderMin) / span;
  return {
    left: `calc(${r}px + (100% - ${2 * r}px) * ${f1})`,
    right: `calc(${r}px + (100% - ${2 * r}px) * ${1 - f2})`,
  };
}

/**
 * Czyści wyłącznie filtry atrybutów (rozmiar, materiał, wykończenie, LED, cena).
 * **Nie zmienia** zakresu listingu: `category` (Medusa) i `pill` (np. Cenniki / Wszystkie)
 * zostają — żeby „Wyczyść” nie rozszerzało katalogu poza wybraną sekcję ani nie
 * gubiło wybór „Wszystkie” w pigułkach.
 */
export function clearNonCategoryFilters(f: ActiveFilters): ActiveFilters {
  return {
    ...f,
    sizes: [],
    materials: [],
    finishes: [],
    led: undefined,
    priceMin: undefined,
    priceMax: undefined,
  };
}

export function resultCountLabel(count: number): string {
  if (count === 1) return "1 produkt";
  if (count < 5) return `${count} produkty`;
  return `${count} produktów`;
}

/**
 * Medusa v2: parametr to już dziesiętne PLN (nie grosze). Nazwę funkcji
 * zachowujemy dla zgodności wywołań.
 */
export function formatPricePLN(amount: number): string {
  return `${Math.round(amount)} PLN`;
}

/** Czy przycisk „Wyczyść” ma sens — tylko filtry usuwane przez `clearNonCategoryFilters`. */
export function hasClearableNonCategoryFilters(f: ActiveFilters): boolean {
  return (
    f.sizes.length > 0 ||
    f.materials.length > 0 ||
    f.finishes.length > 0 ||
    f.led !== undefined ||
    f.priceMin !== undefined ||
    f.priceMax !== undefined
  );
}

