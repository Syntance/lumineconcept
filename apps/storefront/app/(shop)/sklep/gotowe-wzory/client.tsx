"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { FilterDrawer } from "@/components/product/FilterDrawer";
import { ShopProductSearch } from "@/components/product/ShopProductSearch";
import { SortBarDesktopChips, SortBarMobile } from "@/components/product/SortBar";
import { SortSelect } from "@/components/product/SortSelect";
import type { ActiveFilters, FilterConfig } from "@/components/product/filter-types";
import {
  clearNonCategoryFilters,
} from "@/components/product/filter-types";
import { trackCategoryViewed, trackProductFiltered, trackSearchQuery } from "@/lib/analytics/events";
import { MIN_PRODUCT_SEARCH_LENGTH } from "@/lib/products/product-search";
import { useShopListingCategoryOptional } from "@/components/shop/ShopListingCategoryContext";
import { medusaCategoryIdsForScope } from "@moduly/magazyn-core";
import { extractFilterConfig, type SimpleProduct } from "@/lib/products/simple-product";
import type { GlobalConfigOption } from "@/lib/products/global-config";

export type { SimpleProduct };

const PAGE_SIZE = 24;

/** Stała referencja — domyślne `{}` w parametrach tworzyłoby nowy obiekt co render i zapętlało useEffect. */
const EMPTY_MEDUSA_CATEGORY_SCOPE: Record<string, string[]> = Object.freeze({});

function buildProductsUrl(
  offset: number,
  limit: number,
  f: ActiveFilters,
  medusaCategoryScopeMap: Record<string, string[]>,
): string {
  const params = new URLSearchParams();
  params.set("_offset", String(offset));
  params.set("_limit", String(limit));
  const medusaIds = medusaCategoryIdsForScope(f.category, medusaCategoryScopeMap);
  if (medusaIds?.length) params.set("category", medusaIds.join(","));
  params.set("sort", f.sort);
  if (f.sizes.length) params.set("sizes", f.sizes.join(","));
  if (f.materials.length) params.set("materials", f.materials.join(","));
  if (f.finishes.length) params.set("finishes", f.finishes.join(","));
  if (f.led === true) params.set("led", "1");
  if (f.led === false) params.set("led", "0");
  if (f.priceMin !== undefined) params.set("priceMin", String(f.priceMin));
  if (f.priceMax !== undefined) params.set("priceMax", String(f.priceMax));
  if (f.pill && f.pill !== "all") params.set("pill", f.pill);
  if (f.search && f.search.trim().length >= MIN_PRODUCT_SEARCH_LENGTH) {
    params.set("q", f.search.trim());
  }
  return `/api/products?${params.toString()}`;
}

interface ShopGridClientProps {
  initialProducts: SimpleProduct[];
  totalCount: number;
  initialFilter?: string;
  /** Domyślna pigułka kategorii (Cenniki / Certyfikaty …); bez tego UI traktuje jak „Wszystkie”. */
  initialPill?: string;
  /**
   * ID root kategorii Medusy dla tej listy (ten sam, co bez `?kat=`).
   * Używane przy pigułkach: jedna logiczna „kategoria” — reset `?kat=` i
   * brak zdublowanego chipa z nazwą sekcji.
   */
  defaultListingCategoryId: string;
  initialSort: string;
  /** Podkategorie z Medusy (magazyn) — filtry „Kategoria” w sidebarze. */
  categoryFilters: Array<{ id: string; handle: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  productBasePath: string;
  globalColors?: GlobalConfigOption[];
  /**
   * Mapa: aktywne `filters.category` → lista ID dla Medusy (węzeł + potomkowie).
   * Dzięki temu „Wszystkie” / root listingu obejmuje produkty tylko w podkategoriach.
   */
  medusaCategoryScopeMap?: Record<string, string[]>;
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
  initialPill,
  defaultListingCategoryId,
  initialSort,
  categoryFilters,
  categories,
  productBasePath,
  globalColors = [],
  medusaCategoryScopeMap,
}: ShopGridClientProps) {
  const resolvedMedusaScopeMap = medusaCategoryScopeMap ?? EMPTY_MEDUSA_CATEGORY_SCOPE;
  /** Prymityw stabilny przy tym samym zestawie ID (w przeciwieństwie do referencji obiektu z RSC). */
  const medusaScopeKey = JSON.stringify(resolvedMedusaScopeMap);
  const listingCategory = useShopListingCategoryOptional();

  const [products, setProducts] = useState<SimpleProduct[]>(initialProducts);
  const [totalFiltered, setTotalFiltered] = useState(totalCount);
  const [listLoading, setListLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(() =>
    extractFilterConfig(initialProducts),
  );

  const [filters, setFilters] = useState<ActiveFilters>({
    category: initialFilter,
    pill:
      initialPill && initialPill !== "" && initialPill !== "all" ? initialPill : undefined,
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
        search: filters.search ?? "",
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
      filters.search,
    ],
  );

  useEffect(() => {
    const trimmed = searchInput.trim();
    const timer = setTimeout(() => {
      const nextSearch =
        trimmed.length >= MIN_PRODUCT_SEARCH_LENGTH ? trimmed : undefined;
      setFilters((prev) =>
        prev.search === nextSearch ? prev : { ...prev, search: nextSearch },
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    trackCategoryViewed(productBasePath.split("/").pop() ?? "all", productBasePath);
  }, [productBasePath]);

  useEffect(() => {
    let cancelled = false;
    const medusaIds = medusaCategoryIdsForScope(filters.category, resolvedMedusaScopeMap);
    const q =
      medusaIds?.length ? `?category=${encodeURIComponent(medusaIds.join(","))}` : "";
    fetch(`/api/products/facets${q}`)
      .then((res) => res.json())
      .then((data: FilterConfig) => {
        if (!cancelled && data && typeof data === "object") setFilterConfig(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filters.category, medusaScopeKey]);

  useEffect(() => {
    if (isFirstListEffectRef.current) {
      isFirstListEffectRef.current = false;
      return;
    }

    let cancelled = false;
    const f = filtersRef.current;
    setListLoading(true);
    setProducts([]);

    fetch(buildProductsUrl(0, PAGE_SIZE, f, resolvedMedusaScopeMap))
      .then(async (res) => {
        const data = (await res.json()) as { products: SimpleProduct[]; count: number };
        if (!cancelled && res.ok) {
          setProducts(data.products);
          setTotalFiltered(data.count);
          if (f.search && f.search.trim().length >= MIN_PRODUCT_SEARCH_LENGTH) {
            trackSearchQuery(f.search.trim(), data.count);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterFingerprint, medusaScopeKey]);

  const loadMore = useCallback(async () => {
    if (loadingMore || listLoading) return;
    const offset = products.length;
    if (offset >= totalFiltered) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        buildProductsUrl(offset, PAGE_SIZE, filters, resolvedMedusaScopeMap),
      );
      const data = (await res.json()) as { products: SimpleProduct[]; count: number };
      if (res.ok) setProducts((prev) => [...prev, ...data.products]);
    } finally {
      setLoadingMore(false);
    }
  }, [filters, products.length, totalFiltered, loadingMore, listLoading, medusaScopeKey]);

  const handleFiltersChange = useCallback((next: ActiveFilters) => {
    if (!next.search && searchInput) {
      setSearchInput("");
    }
    setFilters(next);
    if (next.category !== undefined) {
      listingCategory?.setActiveCategoryId(next.category);
    }
    trackProductFiltered({
      category: next.category,
      sizes: next.sizes,
      materials: next.materials,
      finishes: next.finishes,
      led: next.led,
      priceMin: next.priceMin,
      priceMax: next.priceMax,
      sort: next.sort,
      search: next.search,
    });
  }, [searchInput, listingCategory]);

  const showLoadMore = !listLoading && products.length > 0 && products.length < totalFiltered;

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <FilterSidebar
        defaultListingCategoryId={defaultListingCategoryId}
        categoryFilters={categoryFilters}
        activeFilters={filters}
        filterConfig={filterConfig}
        onFiltersChange={handleFiltersChange}
        matchCount={totalFiltered}
        catalogLoading={listLoading}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SortBarMobile
          defaultListingCategoryId={defaultListingCategoryId}
          activeFilters={filters}
          onFiltersChange={handleFiltersChange}
          onOpenDrawer={() => setDrawerOpen(true)}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
        />

        {/* Desktop: wyszukiwanie + sortowanie */}
        <div className="hidden lg:flex lg:flex-col">
          <div className="flex min-h-10 w-full items-center gap-4">
            <div className="min-w-0 flex-1">
              <ShopProductSearch value={searchInput} onChange={setSearchInput} />
            </div>
            <SortSelect
              value={filters.sort}
              onChange={(sort) => handleFiltersChange({ ...filters, sort })}
            />
          </div>
          <div className="mt-3 h-px bg-brand-100" aria-hidden />
          <div className="mt-5 space-y-3">
            <SortBarDesktopChips
              activeFilters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>

        <FilterDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          defaultListingCategoryId={defaultListingCategoryId}
          categoryFilters={categoryFilters}
          categories={categories}
          activeFilters={filters}
          filterConfig={filterConfig}
          resultCount={totalFiltered}
          catalogLoading={listLoading}
          onFiltersChange={handleFiltersChange}
        />

        {listLoading && products.length === 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-lg bg-brand-100" />
                <div className="mt-3 h-4 w-3/4 rounded bg-brand-100" />
                <div className="mt-2 h-4 w-1/3 rounded bg-brand-100" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:mt-4 lg:grid-cols-3">
              {products.map((product, index) => (
                <div key={product.id} className="relative">
                  <ProductCard
                    handle={product.handle}
                    title={product.title}
                    thumbnail={product.thumbnail}
                    price={product.price}
                    href={`${productBasePath}/${product.handle}`}
                    hideMaterialRow
                    badge={getBadge(product.tags)}
                    hasVariantPrices={product.hasVariantPrices}
                    variantId={product.variantId ?? undefined}
                    productId={product.id}
                    productOptions={product.options}
                    linksCount={product.linksCount}
                    productMetadata={product.metadata}
                    variantMetadata={product.firstVariantMetadata}
                    globalColors={globalColors}
                    priority={index < 6}
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
            <p className="text-brand-500">
              {filters.search && filters.search.trim().length >= MIN_PRODUCT_SEARCH_LENGTH
                ? `Brak produktów dla „${filters.search.trim()}”.`
                : "Brak produktów spełniających kryteria."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setFilters(clearNonCategoryFilters(filters));
              }}
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
