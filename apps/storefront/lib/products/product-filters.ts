import { matchesPill } from "@/components/product/filter-types";
import type { SimpleProduct } from "./simple-product";

export interface ProductFilterParams {
  sizes: string[];
  materials: string[];
  finishes: string[];
  led?: boolean;
  priceMin?: number;
  priceMax?: number;
  pill?: string;
}

export function productPassesFilters(p: SimpleProduct, f: ProductFilterParams): boolean {
  if (f.materials.length > 0) {
    const productMats = (p.options["Materiał"] ?? []).map((m) => m.toLowerCase());
    if (!f.materials.some((fm) => productMats.includes(fm.toLowerCase()))) return false;
  }

  if (f.finishes.length > 0) {
    const productFin = (p.options["Wykończenie"] ?? []).map((x) => x.toLowerCase());
    if (!f.finishes.some((ff) => productFin.includes(ff.toLowerCase()))) return false;
  }

  if (f.led === true) {
    const hasLedOption = p.options["LED"]?.some((v) => v.toLowerCase() === "tak");
    const hasLedTag = p.tags.includes("led");
    if (!hasLedOption && !hasLedTag) return false;
  }
  if (f.led === false) {
    const hasLedOption = p.options["LED"]?.some((v) => v.toLowerCase() === "tak");
    const hasLedTag = p.tags.includes("led");
    if (hasLedOption || hasLedTag) return false;
  }

  if (f.priceMin !== undefined && p.price < f.priceMin) return false;
  if (f.priceMax !== undefined && p.price > f.priceMax) return false;

  if (f.sizes.length > 0) {
    const productSizes = (p.options["Rozmiar"] ?? []).map((s) => s.toLowerCase());
    if (!f.sizes.some((fs) => productSizes.includes(fs.toLowerCase()))) return false;
  }

  if (f.pill && f.pill !== "all" && !matchesPill(f.pill, p.handle, p.title)) return false;

  return true;
}
