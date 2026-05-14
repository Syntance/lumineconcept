"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActiveFilters, FilterConfig } from "./filter-types";
import {
  PRICE_RANGE_INPUT_CLASS,
  PRICE_RANGE_INNER_CLASS,
  PRICE_RANGE_ROW_CLASS,
  PRICE_RANGE_TRACK_ACTIVE_CLASS,
  PRICE_RANGE_TRACK_IDLE_CLASS,
  priceRangeActiveTrackStyle,
  PRODUCT_PILLS,
  PRICE_SLIDER_MIN,
  PRICE_SLIDER_MAX,
  PRICE_STEP,
  clearNonCategoryFilters,
  formatPricePLN,
  hasClearableNonCategoryFilters,
} from "./filter-types";

interface FilterSidebarProps {
  /**
   * Root kategorii tej listy; przy zmianie pigułki zastępujemy węższe `?kat=`
   * i trzymamy jeden aktywny wybór (Medusa: zawsze ten sam scope + filtr pigułki).
   */
  defaultListingCategoryId: string;
  activeFilters: ActiveFilters;
  filterConfig: FilterConfig;
  onFiltersChange: (filters: ActiveFilters) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function FilterSidebar({
  defaultListingCategoryId,
  activeFilters,
  filterConfig,
  onFiltersChange,
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

  const sliderMin = filterConfig.minPrice || PRICE_SLIDER_MIN;
  const sliderMax = filterConfig.maxPrice || PRICE_SLIDER_MAX;
  const [localMin, setLocalMin] = useState(activeFilters.priceMin ?? sliderMin);
  const [localMax, setLocalMax] = useState(activeFilters.priceMax ?? sliderMax);

  useEffect(() => {
    setLocalMin(activeFilters.priceMin ?? sliderMin);
    setLocalMax(activeFilters.priceMax ?? sliderMax);
  }, [activeFilters.priceMin, activeFilters.priceMax, sliderMin, sliderMax]);

  const commitPrice = () => {
    update({
      priceMin: localMin <= sliderMin ? undefined : localMin,
      priceMax: localMax >= sliderMax ? undefined : localMax,
    });
  };

  return (
    <aside className="hidden w-60 shrink-0 self-start lg:z-10 lg:block lg:sticky lg:top-24">
      <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-4 pb-8">
        {/* Header — min-h-10 + mt-3 jak kolumna z licznikiem (ShopGridClient), żeby kreski były w jednej linii. */}
        <div className="flex min-h-10 items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold tracking-wide text-brand-800">
            Filtry
          </h2>
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
            {PRODUCT_PILLS.map((pill) => {
              const isActive = (activeFilters.pill ?? "all") === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => {
                    const nextPill = pill.value === "all" ? undefined : pill.value;
                    update({
                      pill: nextPill,
                      ...(defaultListingCategoryId
                        ? { category: defaultListingCategoryId }
                        : {}),
                    });
                  }}
                  className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                    isActive
                      ? "bg-brand-500/10 text-brand-800 font-medium"
                      : "text-brand-500 hover:bg-brand-500/10"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </details>

        {/* Cena — suwak */}
        <details open>
          <summary className="cursor-pointer pb-2 text-sm font-semibold uppercase tracking-wider text-brand-800 select-none">
            Cena
          </summary>
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 pt-1">
            <div className="flex min-w-0 w-full items-center justify-between text-sm font-medium tabular-nums text-brand-500">
              <span>{formatPricePLN(localMin)}</span>
              <span>{formatPricePLN(localMax)}</span>
            </div>
            <div className={PRICE_RANGE_ROW_CLASS}>
              <div className={PRICE_RANGE_INNER_CLASS}>
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={PRICE_STEP}
                  value={localMin}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v <= localMax - PRICE_STEP) setLocalMin(v);
                  }}
                  onMouseUp={commitPrice}
                  onTouchEnd={commitPrice}
                  className={PRICE_RANGE_INPUT_CLASS}
                  aria-label="Cena minimalna"
                />
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={PRICE_STEP}
                  value={localMax}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= localMin + PRICE_STEP) setLocalMax(v);
                  }}
                  onMouseUp={commitPrice}
                  onTouchEnd={commitPrice}
                  className={PRICE_RANGE_INPUT_CLASS}
                  aria-label="Cena maksymalna"
                />
                <div className={PRICE_RANGE_TRACK_IDLE_CLASS} />
                <div
                  className={PRICE_RANGE_TRACK_ACTIVE_CLASS}
                  style={priceRangeActiveTrackStyle({
                    localMin,
                    localMax,
                    sliderMin,
                    sliderMax,
                  })}
                />
              </div>
            </div>
          </div>
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
