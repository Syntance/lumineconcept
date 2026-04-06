"use client";

import { useCallback, useEffect, useState } from "react";
import type { ActiveFilters, FilterConfig } from "./filter-types";
import {
  PRODUCT_PILLS,
  PRICE_SLIDER_MIN,
  PRICE_SLIDER_MAX,
  PRICE_STEP,
  clearFilters,
  formatPricePLN,
  hasAnyActiveFilter,
} from "./filter-types";

interface FilterSidebarProps {
  activeFilters: ActiveFilters;
  filterConfig: FilterConfig;
  onFiltersChange: (filters: ActiveFilters) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export function FilterSidebar({
  activeFilters,
  filterConfig,
  onFiltersChange,
}: FilterSidebarProps) {
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
        {/* Header — min-h-9 jak wiersz sortowania (select h-9), żeby kreski były w jednej linii */}
        <div className="flex min-h-9 items-center justify-between">
          <h2 className="font-display text-base font-semibold tracking-wide text-brand-800">
            Filtry
          </h2>
          {hasAnyActiveFilter(activeFilters) && (
            <button
              type="button"
              onClick={() => onFiltersChange(clearFilters(activeFilters.sort, activeFilters.pill))}
              className="text-[13px] text-brand-400 underline underline-offset-2 hover:text-brand-600 transition-colors"
            >
              Wyczyść
            </button>
          )}
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
                  onClick={() =>
                    update({
                      pill: pill.value === "all" ? undefined : pill.value,
                    })
                  }
                  className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent-dark font-medium"
                      : "text-brand-600 hover:bg-brand-50"
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
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-sm text-brand-500">
              <span>{formatPricePLN(localMin)}</span>
              <span>{formatPricePLN(localMax)}</span>
            </div>
            <div className="relative h-5 flex items-center">
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
                className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm"
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
                className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm"
                aria-label="Cena maksymalna"
              />
              {/* Track bg */}
              <div className="absolute inset-x-0 h-1 rounded-full bg-brand-200" />
              <div
                className="absolute h-1 rounded-full bg-accent"
                style={{
                  left: `${((localMin - sliderMin) / (sliderMax - sliderMin)) * 100}%`,
                  right: `${100 - ((localMax - sliderMin) / (sliderMax - sliderMin)) * 100}%`,
                }}
              />
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
                        ? "bg-accent/10 text-accent-dark font-medium"
                        : "text-brand-600 hover:bg-brand-50"
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
                        ? "bg-accent/10 text-accent-dark font-medium"
                        : "text-brand-600 hover:bg-brand-50"
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
                    ? "bg-accent/10 text-accent-dark font-medium"
                    : "text-brand-600 hover:bg-brand-50"
                }`}
              >
                Z LED
              </button>
              <button
                type="button"
                onClick={() => update({ led: activeFilters.led === false ? undefined : false })}
                className={`rounded-md px-3 py-1.5 text-left text-base transition-colors ${
                  activeFilters.led === false
                    ? "bg-accent/10 text-accent-dark font-medium"
                    : "text-brand-600 hover:bg-brand-50"
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
                        ? "bg-accent/10 text-accent-dark font-medium"
                        : "text-brand-600 hover:bg-brand-50"
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
