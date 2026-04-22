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

export function clearFilters(sort: string, pill?: string): ActiveFilters {
  return {
    sort,
    pill,
    sizes: [],
    materials: [],
    finishes: [],
    category: undefined,
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

export function hasAnyActiveFilter(f: ActiveFilters): boolean {
  return (
    !!f.category ||
    f.sizes.length > 0 ||
    f.materials.length > 0 ||
    f.finishes.length > 0 ||
    f.led !== undefined ||
    f.priceMin !== undefined ||
    f.priceMax !== undefined ||
    (!!f.pill && f.pill !== "all")
  );
}
