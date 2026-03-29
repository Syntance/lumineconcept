export interface FilterConfig {
  colors: string[];
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
  colors: string[];
  led?: boolean;
  priceMin?: number;
  priceMax?: number;
  sizes: string[];
  materials: string[];
  finishes: string[];
  availability?: "in_stock" | "on_order";
  tags: string[];
}

export const PRODUCT_PILLS = [
  { value: "all", label: "Wszystkie" },
  { value: "cenniki", label: "Cenniki" },
  { value: "tabliczki", label: "Tabliczki" },
  { value: "menu", label: "Menu" },
  { value: "qr", label: "QR" },
  { value: "wizytowniki", label: "Wizytowniki" },
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
      return h.includes("wizytownik") || h.includes("certyfikat") || h.includes("voucher");
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

export const PRICE_STEP = 1000;
export const PRICE_SLIDER_MIN = 0;
export const PRICE_SLIDER_MAX = 100000;

export const COLOR_MAP: Record<string, string> = {
  czarny: "#1a1a1a",
  biały: "#ffffff",
  złoty: "#D4AF37",
  "rose gold": "#B76E79",
  srebrny: "#C0C0C0",
  przezroczysty: "transparent",
  różowy: "#E8A0BF",
  beżowy: "#D4C5B2",
  szary: "#8B8B8B",
  brązowy: "#6B4226",
};

export const TAG_OPTIONS = [
  { value: "bestseller", label: "Bestseller" },
  { value: "nowość", label: "Nowość" },
  { value: "promocja", label: "Promocja" },
] as const;

export function clearFilters(sort: string, pill?: string): ActiveFilters {
  return {
    sort,
    pill,
    colors: [],
    sizes: [],
    materials: [],
    finishes: [],
    tags: [],
    category: undefined,
    led: undefined,
    priceMin: undefined,
    priceMax: undefined,
    availability: undefined,
  };
}

export function resultCountLabel(count: number): string {
  if (count === 1) return "1 produkt";
  if (count < 5) return `${count} produkty`;
  return `${count} produktów`;
}

export function formatPricePLN(amountInCents: number): string {
  return `${Math.round(amountInCents / 100)} PLN`;
}

export function hasAnyActiveFilter(f: ActiveFilters): boolean {
  return (
    !!f.category ||
    f.colors.length > 0 ||
    f.sizes.length > 0 ||
    f.materials.length > 0 ||
    f.finishes.length > 0 ||
    f.tags.length > 0 ||
    f.led !== undefined ||
    f.priceMin !== undefined ||
    f.priceMax !== undefined ||
    f.availability !== undefined ||
    (!!f.pill && f.pill !== "all")
  );
}
