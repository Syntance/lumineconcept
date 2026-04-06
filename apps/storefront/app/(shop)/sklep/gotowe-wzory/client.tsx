"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { FilterDrawer } from "@/components/product/FilterDrawer";
import { SortBarDesktopChips, SortBarMobile } from "@/components/product/SortBar";
import type { ActiveFilters, FilterConfig } from "@/components/product/filter-types";
import { resultCountLabel, SORT_OPTIONS } from "@/components/product/filter-types";
import { trackCategoryViewed, trackProductFiltered } from "@/lib/analytics/events";
import { extractFilterConfig, type SimpleProduct } from "@/lib/products/simple-product";
import type { GlobalConfigOption } from "@/lib/products/global-config";

export type { SimpleProduct };

const PAGE_SIZE = 24;

function buildProductsUrl(offset: number, limit: number, f: ActiveFilters): string {
  const params = new URLSearchParams();
  params.set("_offset", String(offset));
  params.set("_limit", String(limit));
  if (f.category) params.set("category", f.category);
  params.set("sort", f.sort);
  if (f.sizes.length) params.set("sizes", f.sizes.join(","));
  if (f.materials.length) params.set("materials", f.materials.join(","));
  if (f.finishes.length) params.set("finishes", f.finishes.join(","));
  if (f.led === true) params.set("led", "1");
  if (f.led === false) params.set("led", "0");
  if (f.priceMin !== undefined) params.set("priceMin", String(f.priceMin));
  if (f.priceMax !== undefined) params.set("priceMax", String(f.priceMax));
  if (f.pill && f.pill !== "all") params.set("pill", f.pill);
  return `/api/products?${params.toString()}`;
}

interface ShopGridClientProps {
  initialProducts: SimpleProduct[];
  totalCount: number;
  initialFilter?: string;
  initialSort: string;
  categories: Array<{ id: string; name: string }>;
  productBasePath: string;
  globalColors?: GlobalConfigOption[];
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
  globalColors = [],
}: ShopGridClientProps) {
  const [products, setProducts] = useState<SimpleProduct[]>(initialProducts);
  const [totalFiltered, setTotalFiltered] = useState(totalCount);
  const [listLoading, setListLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(() =>
    extractFilterConfig(initialProducts),
  );

  const [filters, setFilters] = useState<ActiveFilters>({
    category: initialFilter,
    pill: undefined,
    sort: initialSort,
    sizes: [],
    materials: [],
    finishes: [],
  });

  const isFirstListEffectRef = useRef(true);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const filterFingerprint = useMemo(
    () =>
      JSON.stringify({
        sort: filters.sort,
        category: filters.category ?? "",
        sizes: filters.sizes,
        materials: filters.materials,
        finishes: filters.finishes,
        led: filters.led ?? null,
        priceMin: filters.priceMin ?? null,
        priceMax: filters.priceMax ?? null,
        pill: filters.pill ?? "",
      }),
    [
      filters.sort,
      filters.category,
      filters.sizes,
      filters.materials,
      filters.finishes,
      filters.led,
      filters.priceMin,
      filters.priceMax,
      filters.pill,
    ],
  );

  useEffect(() => {
    trackCategoryViewed(productBasePath.split("/").pop() ?? "all", productBasePath);
  }, [productBasePath]);

  useEffect(() => {
    let cancelled = false;
    const q = filters.category ? `?category=${encodeURIComponent(filters.category)}` : "";
    fetch(`/api/products/facets${q}`)
      .then((res) => res.json())
      .then((data: FilterConfig) => {
        if (!cancelled && data && typeof data === "object") setFilterConfig(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filters.category]);

  useEffect(() => {
    if (isFirstListEffectRef.current) {
      isFirstListEffectRef.current = false;
      return;
    }

    let cancelled = false;
    const f = filtersRef.current;
    setListLoading(true);
    setProducts([]);

    fetch(buildProductsUrl(0, PAGE_SIZE, f))
      .then(async (res) => {
        const data = (await res.json()) as { products: SimpleProduct[]; count: number };
        if (!cancelled && res.ok) {
          setProducts(data.products);
          setTotalFiltered(data.count);
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterFingerprint]);

  const loadMore = useCallback(async () => {
    if (loadingMore || listLoading) return;
    const offset = products.length;
    if (offset >= totalFiltered) return;
    setLoadingMore(true);
    try {
      const res = await fetch(buildProductsUrl(offset, PAGE_SIZE, filters));
      const data = (await res.json()) as { products: SimpleProduct[]; count: number };
      if (res.ok) setProducts((prev) => [...prev, ...data.products]);
    } finally {
      setLoadingMore(false);
    }
  }, [filters, products.length, totalFiltered, loadingMore, listLoading]);

  const handleFiltersChange = useCallback((next: ActiveFilters) => {
    setFilters(next);
    trackProductFiltered({
      category: next.category,
      sizes: next.sizes,
      materials: next.materials,
      finishes: next.finishes,
      led: next.led,
      priceMin: next.priceMin,
      priceMax: next.priceMax,
      sort: next.sort,
    });
  }, []);

  const countBlock = (
    <>
      {listLoading ? (
        <span className="text-brand-500">Ładowanie…</span>
      ) : (
        <>
          <span className="font-medium text-brand-800">{resultCountLabel(totalFiltered)}</span>
          <span className="text-brand-500"> — dopasowanych do wybranych filtrów</span>
        </>
      )}
    </>
  );

  const showLoadMore = !listLoading && products.length > 0 && products.length < totalFiltered;

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <FilterSidebar
        activeFilters={filters}
        filterConfig={filterConfig}
        onFiltersChange={handleFiltersChange}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SortBarMobile
          categories={categories}
          activeFilters={filters}
          onFiltersChange={handleFiltersChange}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <div className="hidden lg:flex lg:flex-col">
          <div className="flex min-h-9 w-full items-center justify-between gap-4">
            <p className="min-w-0 flex-1 text-base leading-snug text-brand-600" aria-live="polite">
              {countBlock}
            </p>
            <select
              value={filters.sort}
              onChange={(e) => handleFiltersChange({ ...filters, sort: e.target.value })}
              className="h-9 shrink-0 rounded-md border border-brand-200 bg-white px-3 py-1.5 text-sm text-brand-700"
              aria-label="Sortowanie"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 h-px bg-brand-100" aria-hidden />
          <div className="mt-5 space-y-3">
            <SortBarDesktopChips
              categories={categories}
              activeFilters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>

        <FilterDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          categories={categories}
          activeFilters={filters}
          filterConfig={filterConfig}
          resultCount={totalFiltered}
          catalogLoading={listLoading}
          onFiltersChange={handleFiltersChange}
        />

        <p className="mt-4 text-base text-brand-600 lg:hidden" aria-live="polite">
          {countBlock}
        </p>

        {listLoading && products.length === 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-lg bg-brand-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-brand-100" />
                <div className="mt-2 h-4 w-1/3 rounded bg-brand-100" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-4 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard
                    handle={product.handle}
                    title={product.title}
                    thumbnail={product.thumbnail}
                    price={product.price}
                    href={`${productBasePath}/${product.handle}`}
                    badge={getBadge(product.tags)}
                    hasVariantPrices={product.hasVariantPrices}
                    variantId={product.variantId ?? undefined}
                    productId={product.id}
                    productOptions={product.options}
                    linksCount={product.linksCount}
                    productMetadata={product.metadata}
                    variantMetadata={product.firstVariantMetadata}
                    globalColors={globalColors}
                  />
                </div>
              ))}
            </div>
            {showLoadMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-md border border-brand-200 bg-white px-6 py-2.5 text-base font-medium text-brand-800 transition-colors hover:bg-brand-50 disabled:opacity-50"
                >
                  {loadingMore ? "Ładowanie…" : "Pokaż więcej"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center">
            <p className="text-brand-500">Brak produktów spełniających kryteria.</p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  sort: filters.sort,
                  pill: filters.pill,
                  sizes: [],
                  materials: [],
                  finishes: [],
                  category: undefined,
                  led: undefined,
                  priceMin: undefined,
                  priceMax: undefined,
                })
              }
              className="mt-3 text-base text-accent underline underline-offset-2 hover:text-accent-dark"
            >
              Wyczyść filtry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
