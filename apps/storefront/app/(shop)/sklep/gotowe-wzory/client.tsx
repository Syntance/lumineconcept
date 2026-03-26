"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterBar, type ActiveFilters, type FilterConfig } from "@/components/product/FilterBar";
import { trackCategoryViewed, trackProductFiltered } from "@/lib/analytics/events";

export interface SimpleProduct {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number;
  hasVariantPrices: boolean;
  tags: string[];
  options: Record<string, string[]>;
}

interface ShopGridClientProps {
  initialProducts: SimpleProduct[];
  totalCount: number;
  initialFilter?: string;
  initialSort: string;
  categories: Array<{ id: string; name: string }>;
  productBasePath: string;
}

const PAGE_SIZE = 12;

function extractFilterConfig(products: SimpleProduct[]): FilterConfig {
  const colorsSet = new Set<string>();
  const sizesSet = new Set<string>();
  let hasLed = false;
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const p of products) {
    if (p.options["Kolor"]) {
      for (const c of p.options["Kolor"]) colorsSet.add(c);
    }
    if (p.options["Rozmiar"]) {
      for (const s of p.options["Rozmiar"]) sizesSet.add(s);
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
    colors: Array.from(colorsSet).sort(),
    sizes: Array.from(sizesSet),
    hasLed,
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice,
  };
}

function applyFilters(products: SimpleProduct[], filters: ActiveFilters): SimpleProduct[] {
  return products.filter((p) => {
    if (filters.colors.length > 0) {
      const productColors = (p.options["Kolor"] ?? []).map((c) => c.toLowerCase());
      if (!filters.colors.some((fc) => productColors.includes(fc.toLowerCase()))) return false;
    }

    if (filters.led === true) {
      const hasLedOption = p.options["LED"]?.some((v) => v.toLowerCase() === "tak");
      const hasLedTag = p.tags.includes("led");
      if (!hasLedOption && !hasLedTag) return false;
    }
    if (filters.led === false) {
      const hasLedOption = p.options["LED"]?.some((v) => v.toLowerCase() === "tak");
      const hasLedTag = p.tags.includes("led");
      if (hasLedOption || hasLedTag) return false;
    }

    if (filters.priceMin !== undefined && p.price < filters.priceMin) return false;
    if (filters.priceMax !== undefined && p.price > filters.priceMax) return false;

    if (filters.sizes.length > 0) {
      const productSizes = (p.options["Rozmiar"] ?? []).map((s) => s.toLowerCase());
      if (!filters.sizes.some((fs) => productSizes.includes(fs.toLowerCase()))) return false;
    }

    return true;
  });
}

function getBadge(tags: string[]): "bestseller" | "nowość" | null {
  if (tags.includes("bestseller")) return "bestseller";
  if (tags.includes("nowość")) return "nowość";
  return null;
}

export function ShopGridClient({
  initialProducts,
  totalCount,
  initialFilter,
  initialSort,
  categories,
  productBasePath,
}: ShopGridClientProps) {
  const [allProducts, setAllProducts] = useState<SimpleProduct[]>(initialProducts);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [filters, setFilters] = useState<ActiveFilters>({
    category: initialFilter,
    sort: initialSort,
    colors: [],
    sizes: [],
  });

  useEffect(() => {
    trackCategoryViewed(productBasePath.split("/").pop() ?? "all", productBasePath);
  }, [productBasePath]);

  const filterConfig = useMemo(() => extractFilterConfig(allProducts), [allProducts]);

  const filteredProducts = useMemo(
    () => applyFilters(allProducts, filters),
    [allProducts, filters],
  );

  const handleFiltersChange = useCallback((next: ActiveFilters) => {
    setFilters(next);
    trackProductFiltered({
      category: next.category,
      colors: next.colors,
      sizes: next.sizes,
      led: next.led,
      priceMin: next.priceMin,
      priceMax: next.priceMax,
      sort: next.sort,
    });
  }, []);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("_offset", String(allProducts.length));
      params.set("_limit", String(PAGE_SIZE));
      if (filters.category) params.set("category", filters.category);
      params.set("sort", filters.sort);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { products: SimpleProduct[]; count: number };
      setAllProducts((prev) => [...prev, ...data.products]);
      setHasMore(allProducts.length + data.products.length < data.count);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const crossSellBannerIndex = 8;

  return (
    <>
      <FilterBar
        categories={categories}
        activeFilters={filters}
        filterConfig={filterConfig}
        resultCount={filteredProducts.length}
        onFiltersChange={handleFiltersChange}
      />

      {/* Grid */}
      {filteredProducts.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <Fragment key={product.id}>
              {index === crossSellBannerIndex && (
                <div className="col-span-2 lg:col-span-4 flex flex-col items-center justify-center gap-4 rounded-2xl bg-brand-50 px-6 py-10 text-center">
                  <p className="text-lg font-display tracking-wide text-brand-800">
                    Szukasz czegoś na zamówienie?
                  </p>
                  <p className="text-sm text-brand-600">
                    Logo z własnym projektem, cennik pod wymiar — wycena w 24h
                  </p>
                  <Link
                    href="/logo-3d/#formularz"
                    className="inline-flex items-center justify-center rounded-md bg-brand-900 px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-brand-800"
                  >
                    Zamów wycenę &rarr;
                  </Link>
                </div>
              )}
              <div className="relative">
                <ProductCard
                  handle={product.handle}
                  title={product.title}
                  thumbnail={product.thumbnail}
                  price={product.price}
                  href={`${productBasePath}/${product.handle}`}
                  badge={getBadge(product.tags)}
                  colorSwatches={product.options["Kolor"]}
                  hasVariantPrices={product.hasVariantPrices}
                />
              </div>
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-brand-500">
            Brak produktów spełniających kryteria.
          </p>
          <button
            type="button"
            onClick={() =>
              setFilters({
                sort: filters.sort,
                colors: [],
                sizes: [],
                category: undefined,
                led: undefined,
                priceMin: undefined,
                priceMax: undefined,
              })
            }
            className="mt-3 text-sm text-accent underline underline-offset-2 hover:text-accent-dark"
          >
            Wyczyść filtry
          </button>
        </div>
      )}

      {/* Load more */}
      {hasMore && filteredProducts.length >= PAGE_SIZE && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center justify-center rounded-md border border-brand-200 px-8 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                Ładowanie...
              </span>
            ) : (
              "Pokaż więcej"
            )}
          </button>
        </div>
      )}
    </>
  );
}
