"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActiveFilters, FilterConfig } from "./filter-types";
import {
  clearNonCategoryFilters,
  hasClearableNonCategoryFilters,
  searchResultCountLabel,
} from "./filter-types";
import { PriceRangeFilter } from "./PriceRangeFilter";

interface FilterSidebarProps {
  /**
   * Root kategorii tej listy; „Wszystkie” = ten ID w filtrze Medusy.
   */
  defaultListingCategoryId: string;
  /** Podkategorie z Medusy (edytowane w magazynie). */
  categoryFilters: Array<{ id: string; handle: string; name: string }>;
  activeFilters: ActiveFilters;
  filterConfig: FilterConfig;
  onFiltersChange: (filters: ActiveFilters) => void;
  /** Liczba dopasowań — obok nagłówka „Filtry”. */
  matchCount: number;
  catalogLoading?: boolean;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function FilterSidebar({
  defaultListingCategoryId,
  categoryFilters,
  activeFilters,
  filterConfig,
  onFiltersChange,
  matchCount,
  catalogLoading = false,
}: FilterSidebarProps) {
  /** Po hydratacji — unikamy mismatchu gdy warunek „Wyczyść” różni się między SSR a 1. klientem. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const update = useCallback(
    (patch: Partial<ActiveFilters>) => {
      onFiltersChange({ ...activeFilters, ...patch });
    },
    [activeFilters, onFiltersChange],
  );

  return (
    <aside className="hidden w-60 shrink-0 self-start lg:z-10 lg:block lg:sticky lg:top-24">
      <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 pb-8">
        {/* Header — min-h-10 + mt-3 jak kolumna sortowania (ShopGridClient), żeby kreski były w jednej linii. */}
        <div className="flex min-h-10 items-center justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="font-display text-xl font-semibold tracking-wide text-brand-800">
              Filtry
            </h2>
            <span
              className="text-sm tabular-nums text-brand-500"
              aria-live="polite"
              aria-label={
                catalogLoading
                  ? "Ładowanie liczby wyników"
                  : searchResultCountLabel(matchCount).slice(2)
              }
            >
              {catalogLoading ? "…" : searchResultCountLabel(matchCount)}
            </span>
          </div>
          <div className="flex min-h-10 min-w-[3.25rem] shrink-0 items-center justify-end">
            {mounted && hasClearableNonCategoryFilters(activeFilters) ? (
              <button
                type="button"
                onClick={() => onFiltersChange(clearNonCategoryFilters(activeFilters))}
                className="text-[13px] text-brand-400 underline underline-offset-2 hover:text-brand-800 transition-colors"
              >
                Wyczyść
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 h-px bg-brand-100" />

        <div className="mt-5 space-y-5">
        {/* Kategoria */}
        <details open>
          <summary className="cursor-pointer pb-2 text-sm font-semibold uppercase tracking-wider text-brand-800 select-none">
            Kategoria
          </summary>
          <div className="flex flex-col gap-1 pt-1">
            <button
              type="button"
              onClick={() =>
                update({
                  category: defaultListingCategoryId,
                  pill: undefined,
                })
              }
              className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                activeFilters.category === defaultListingCategoryId ||
                !activeFilters.category
                  ? "bg-brand-500/10 text-brand-800 font-medium"
                  : "text-brand-500 hover:bg-brand-500/10"
              }`}
            >
              Wszystkie
            </button>
            {categoryFilters.map((cat) => {
              const isActive = activeFilters.category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    update({
                      category: cat.id,
                      pill: undefined,
                    })
                  }
                  className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                    isActive
                      ? "bg-brand-500/10 text-brand-800 font-medium"
                      : "text-brand-500 hover:bg-brand-500/10"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </details>

        {/* Cena */}
        <details open>
          <summary className="cursor-pointer pb-2 text-sm font-semibold uppercase tracking-wider text-brand-800 select-none">
            Cena
          </summary>
          <PriceRangeFilter
            activeFilters={activeFilters}
            catalogMaxPrice={filterConfig.maxPrice}
            onFiltersChange={(patch) => update(patch)}
          />
        </details>

        {/* Materiał */}
        {filterConfig.materials.length > 0 && (
          <details open>
            <summary className="cursor-pointer pb-2 text-sm font-semibold uppercase tracking-wider text-brand-800 select-none">
              Materiał
            </summary>
            <div className="flex flex-col gap-1 pt-1">
              {filterConfig.materials.map((mat) => {
                const isActive = activeFilters.materials.includes(mat);
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => update({ materials: toggle(activeFilters.materials, mat) })}
                    className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                      isActive
                        ? "bg-brand-500/10 text-brand-800 font-medium"
                        : "text-brand-500 hover:bg-brand-500/10"
                    }`}
                  >
                    {mat}
                  </button>
                );
              })}
            </div>
          </details>
        )}

        {/* Wykończenie */}
        {filterConfig.finishes.length > 0 && (
          <details open>
            <summary className="cursor-pointer pb-2 text-sm font-semibold uppercase tracking-wider text-brand-800 select-none">
              Wykończenie
            </summary>
            <div className="flex flex-col gap-1 pt-1">
              {filterConfig.finishes.map((fin) => {
                const isActive = activeFilters.finishes.includes(fin);
                return (
                  <button
                    key={fin}
                    type="button"
                    onClick={() => update({ finishes: toggle(activeFilters.finishes, fin) })}
                    className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                      isActive
                        ? "bg-brand-500/10 text-brand-800 font-medium"
                        : "text-brand-500 hover:bg-brand-500/10"
                    }`}
                  >
                    {fin}
                  </button>
                );
              })}
            </div>
          </details>
        )}

        {/* LED */}
        {filterConfig.hasLed && (
          <details open>
            <summary className="cursor-pointer pb-2 text-sm font-semibold uppercase tracking-wider text-brand-800 select-none">
              Podświetlenie LED
            </summary>
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => update({ led: activeFilters.led === true ? undefined : true })}
                className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                  activeFilters.led === true
                    ? "bg-brand-500/10 text-brand-800 font-medium"
                    : "text-brand-500 hover:bg-brand-500/10"
                }`}
              >
                Z LED
              </button>
              <button
                type="button"
                onClick={() => update({ led: activeFilters.led === false ? undefined : false })}
                className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                  activeFilters.led === false
                    ? "bg-brand-500/10 text-brand-800 font-medium"
                    : "text-brand-500 hover:bg-brand-500/10"
                }`}
              >
                Bez LED
              </button>
            </div>
          </details>
        )}

        {/* Rozmiar */}
        {filterConfig.sizes.length > 0 && (
          <details open>
            <summary className="cursor-pointer pb-2 text-sm font-semibold uppercase tracking-wider text-brand-800 select-none">
              Rozmiar
            </summary>
            <div className="flex flex-col gap-1 pt-1">
              {filterConfig.sizes.map((size) => {
                const isActive = activeFilters.sizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => update({ sizes: toggle(activeFilters.sizes, size) })}
                    className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                      isActive
                        ? "bg-brand-500/10 text-brand-800 font-medium"
                        : "text-brand-500 hover:bg-brand-500/10"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </details>
        )}
        </div>
      </div>
    </aside>
  );
}
