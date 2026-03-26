"use client";

import { Fragment, useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";

interface SimpleProduct {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number;
  hasVariantPrices: boolean;
  tags: string[];
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

const SORT_OPTIONS = [
  { value: "-created_at", label: "Najnowsze" },
  { value: "title", label: "Nazwa A-Z" },
  { value: "-title", label: "Nazwa Z-A" },
] as const;

export function ShopGridClient({
  initialProducts,
  totalCount,
  initialFilter,
  initialSort,
  categories,
  productBasePath,
}: ShopGridClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<SimpleProduct[]>(initialProducts);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [, startTransition] = useTransition();

  const activeFilter = searchParams.get("kat") ?? initialFilter;
  const activeSort = searchParams.get("sort") ?? initialSort;

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${productBasePath}?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams, productBasePath],
  );

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("_offset", String(products.length));
      params.set("_limit", String(PAGE_SIZE));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { products: SimpleProduct[]; count: number };
      setProducts((prev) => [...prev, ...data.products]);
      setHasMore(products.length + data.products.length < data.count);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const crossSellBannerIndex = 8;

  return (
    <>
      {/* Filter pills */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => updateParams("kat", null)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !activeFilter
              ? "bg-brand-900 text-white"
              : "border border-brand-200 text-brand-600 hover:bg-brand-50"
          }`}
        >
          Wszystkie
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => updateParams("kat", cat.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === cat.id
                ? "bg-brand-900 text-white"
                : "border border-brand-200 text-brand-600 hover:bg-brand-50"
            }`}
          >
            {cat.name}
          </button>
        ))}

        <div className="ml-auto">
          <select
            value={activeSort}
            onChange={(e) => updateParams("sort", e.target.value)}
            className="rounded-md border border-brand-200 px-3 py-1.5 text-xs text-brand-700"
            aria-label="Sortowanie"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product, index) => (
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
                {product.tags.includes("bestseller") && (
                  <span className="absolute top-2 left-2 z-10 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Bestseller
                  </span>
                )}
                {product.tags.includes("nowość") && (
                  <span className="absolute top-2 left-2 z-10 rounded-full bg-green-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Nowość
                  </span>
                )}
                <ProductCard
                  handle={product.handle}
                  title={product.title}
                  thumbnail={product.thumbnail}
                  price={product.price}
                  href={`${productBasePath}/${product.handle}`}
                />
              </div>
            </Fragment>
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-brand-500">
          Brak produktów w tej kategorii.
        </p>
      )}

      {/* Load more */}
      {hasMore && (
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
