import type { FilterConfig } from "@/components/product/filter-types";

export interface SimpleProduct {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number;
  hasVariantPrices: boolean;
  variantId: string | null;
  tags: string[];
  options: Record<string, string[]>;
  linksCount?: number;
  /** Surowe metadata Medusa (m.in. text_fields dla mini-konfiguratora). */
  metadata?: Record<string, unknown>;
  /** Metadane pierwszego wariantu (np. wymiary zapisane per wariant). */
  firstVariantMetadata?: Record<string, unknown>;
}

function minPriceFromVariants(variants: unknown[] | null | undefined): number {
  if (!variants?.length) return 0;
  const prices = variants
    .map((v) => {
      const vr = v as Record<string, unknown>;
      const cp = vr?.calculated_price as Record<string, unknown> | undefined;
      return Number(cp?.calculated_amount ?? 0);
    })
    .filter((p) => p > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function hasMultiplePrices(variants: unknown[] | null | undefined): boolean {
  if (!variants || variants.length <= 1) return false;
  const prices = new Set(
    variants
      .map((v) => {
        const vr = v as Record<string, unknown>;
        const cp = vr?.calculated_price as Record<string, unknown> | undefined;
        return Number(cp?.calculated_amount ?? 0);
      })
      .filter((p) => p > 0),
  );
  return prices.size > 1;
}

/** Map Medusa store product (list response) do modelu używanego w katalogu. */
export function medusaProductToSimple(p: Record<string, unknown>): SimpleProduct {
  const options = (p.options ?? []) as Array<{
    title: string;
    values: Array<{ value: string }>;
  }>;
  const optionsMap: Record<string, string[]> = {};
  for (const opt of options) {
    optionsMap[opt.title] = (opt.values ?? []).map((v) => v.value);
  }
  const variants = (p.variants ?? []) as unknown[];
  const images = (p.images ?? []) as Array<{ url: string }>;
  const thumbnail = (p.thumbnail as string | null) ?? images[0]?.url ?? null;
  const meta = (p.metadata ?? {}) as Record<string, unknown>;
  const rawLinks = Number(meta.links_count);
  const v0 = variants[0] as { id?: string; metadata?: Record<string, unknown> } | undefined;
  const hasMeta = p.metadata && typeof p.metadata === "object";
  const firstVariantMetadata = v0?.metadata;

  const bpRaw = meta.base_price;
  const bpNum = (bpRaw !== undefined && bpRaw !== null && bpRaw !== "") ? Number(bpRaw) : NaN;
  const basePrice = Number.isFinite(bpNum) && bpNum > 0 ? bpNum : null;

  return {
    id: String(p.id ?? ""),
    handle: String(p.handle ?? ""),
    title: String(p.title ?? ""),
    thumbnail,
    price: minPriceFromVariants(variants) || (basePrice ?? 0),
    hasVariantPrices: hasMultiplePrices(variants),
    variantId: v0?.id ?? null,
    tags: ((p.tags ?? []) as Array<{ value?: string }>).map((t) =>
      (t.value ?? "").toLowerCase(),
    ),
    options: optionsMap,
    linksCount: Number.isFinite(rawLinks) && rawLinks > 0 ? rawLinks : 0,
    metadata: hasMeta ? meta : undefined,
    firstVariantMetadata,
  };
}

export function extractFilterConfig(products: SimpleProduct[]): FilterConfig {
  const sizesSet = new Set<string>();
  const materialsSet = new Set<string>();
  const finishesSet = new Set<string>();
  let hasLed = false;
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const p of products) {
    if (p.options["Rozmiar"]) {
      for (const s of p.options["Rozmiar"]) sizesSet.add(s);
    }
    if (p.options["Materiał"]) {
      for (const m of p.options["Materiał"]) materialsSet.add(m);
    }
    if (p.options["Wykończenie"]) {
      for (const f of p.options["Wykończenie"]) finishesSet.add(f);
    }
    if (p.options["LED"] || p.tags.includes("led")) {
      hasLed = true;
    }
    if (p.price > 0) {
      minPrice = Math.min(minPrice, p.price);
      maxPrice = Math.max(maxPrice, p.price);
    }
  }

  return {
    sizes: Array.from(sizesSet),
    materials: Array.from(materialsSet).sort(),
    finishes: Array.from(finishesSet).sort(),
    hasLed,
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice,
  };
}
