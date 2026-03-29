"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { FilterDrawer } from "@/components/product/FilterDrawer";
import { SortBar } from "@/components/product/SortBar";
import type { ActiveFilters, FilterConfig } from "@/components/product/filter-types";
import { isPriceSort, PRODUCT_PILLS, matchesPill, SORT_OPTIONS } from "@/components/product/filter-types";
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
  const materialsSet = new Set<string>();
  const finishesSet = new Set<string>();
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
    colors: Array.from(colorsSet).sort(),
    sizes: Array.from(sizesSet),
    materials: Array.from(materialsSet).sort(),
    finishes: Array.from(finishesSet).sort(),
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

    if (filters.materials.length > 0) {
      const productMats = (p.options["Materiał"] ?? []).map((m) => m.toLowerCase());
      if (!filters.materials.some((fm) => productMats.includes(fm.toLowerCase()))) return false;
    }

    if (filters.finishes.length > 0) {
      const productFin = (p.options["Wykończenie"] ?? []).map((f) => f.toLowerCase());
      if (!filters.finishes.some((ff) => productFin.includes(ff.toLowerCase()))) return false;
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

    if (filters.tags.length > 0) {
      if (!filters.tags.some((t) => p.tags.includes(t))) return false;
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
  const [isRefetching, setIsRefetching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<ActiveFilters>({
    category: initialFilter,
    pill: undefined,
    sort: initialSort,
    colors: [],
    sizes: [],
    materials: [],
    finishes: [],
    tags: [],
  });

  useEffect(() => {
    trackCategoryViewed(productBasePath.split("/").pop() ?? "all", productBasePath);
  }, [productBasePath]);

  // Refetch when category or sort changes
  useEffect(() => {
    let cancelled = false;

    async function refetch() {
      setIsRefetching(true);
      try {
        const priceSort = isPriceSort(filters.sort);
        const params = new URLSearchParams();
        params.set("_offset", "0");
        // For price sort, fetch all products so we can sort client-side
        params.set("_limit", priceSort ? "200" : String(PAGE_SIZE));
        if (filters.category) params.set("category", filters.category);
        if (!priceSort) params.set("sort", filters.sort);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { products: SimpleProduct[]; count: number };
        if (cancelled) return;

        let products = data.products;
        if (priceSort) {
          products = [...products].sort((a, b) =>
            filters.sort === "price_asc" ? a.price - b.price : b.price - a.price,
          );
        }

        setAllProducts(products);
        setHasMore(!priceSort && products.length < data.count);
      } finally {
        if (!cancelled) setIsRefetching(false);
      }
    }

    if (filters.category !== initialFilter || filters.sort !== initialSort) {
      refetch();
    }

    return () => { cancelled = true; };
  }, [filters.category, filters.sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterConfig = useMemo(() => extractFilterConfig(allProducts), [allProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = applyFilters(allProducts, filters);
    if (filters.pill && filters.pill !== "all") {
      filtered = filtered.filter((p) => matchesPill(filters.pill, p.handle, p.title));
    }
    if (isPriceSort(filters.sort)) {
      return [...filtered].sort((a, b) =>
        filters.sort === "price_asc" ? a.price - b.price : b.price - a.price,
      );
    }
    return filtered;
  }, [allProducts, filters]);

  const handleFiltersChange = useCallback((next: ActiveFilters) => {
    setFilters(next);
    trackProductFiltered({
      category: next.category,
      colors: next.colors,
      sizes: next.sizes,
      materials: next.materials,
      finishes: next.finishes,
      tags: next.tags,
      led: next.led,
      priceMin: next.priceMin,
      priceMax: next.priceMax,
      sort: next.sort,
      availability: next.availability,
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

  return (
    <div className="lg:flex lg:gap-8">
      {/* Desktop sidebar */}
      <FilterSidebar
        activeFilters={filters}
        filterConfig={filterConfig}
        onFiltersChange={handleFiltersChange}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile: sticky sort bar */}
        <SortBar
          categories={categories}
          activeFilters={filters}
          onFiltersChange={handleFiltersChange}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        {/* Pills row + sort (desktop) */}
        <div className="mt-2 flex items-center gap-3 lg:mt-1">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {PRODUCT_PILLS.map((pill) => {
              const isActive = (filters.pill ?? "all") === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() =>
                    handleFiltersChange({
                      ...filters,
                      pill: pill.value === "all" ? undefined : pill.value,
                    })
                  }
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-900 text-white shadow-sm"
                      : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Desktop sort dropdown */}
          <select
            value={filters.sort}
            onChange={(e) => handleFiltersChange({ ...filters, sort: e.target.value })}
            className="hidden shrink-0 rounded-md border border-brand-200 bg-white px-3 py-1.5 text-xs text-brand-700 lg:block"
            aria-label="Sortowanie"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile filter drawer */}
        <FilterDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          categories={categories}
          activeFilters={filters}
          filterConfig={filterConfig}
          resultCount={filteredProducts.length}
          onFiltersChange={handleFiltersChange}
        />

        {/* Product grid */}
        {isRefetching ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-lg bg-brand-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-brand-100" />
                <div className="mt-2 h-4 w-1/3 rounded bg-brand-100" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative">
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
                  pill: filters.pill,
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
                })
              }
              className="mt-3 text-sm text-accent underline underline-offset-2 hover:text-accent-dark"
            >
              Wyczyść filtry
            </button>
          </div>
        )}

        {/* Load more */}
        {hasMore && !isPriceSort(filters.sort) && filteredProducts.length >= PAGE_SIZE && (
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
      </div>
    </div>
  );
}
