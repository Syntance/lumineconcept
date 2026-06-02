"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
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
  resultCountLabel,
} from "./filter-types";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultListingCategoryId: string;
  categories: Array<{ id: string; name: string }>;
  activeFilters: ActiveFilters;
  filterConfig: FilterConfig;
  /** Liczba produktów pasujących do filtrów (pełny katalog musi być wczytany). */
  resultCount: number;
  /** Gdy true, pełna lista się jeszcze ładuje — nie pokazujemy mylącej liczby. */
  catalogLoading?: boolean;
  onFiltersChange: (filters: ActiveFilters) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border border-brand-500 bg-brand-500/10 text-brand-800"
          : "border border-brand-500/35 text-brand-500 hover:border-brand-500/55 hover:bg-brand-500/5"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterDrawer({
  isOpen,
  onClose,
  defaultListingCategoryId,
  categories: _categories,
  activeFilters,
  filterConfig,
  resultCount,
  catalogLoading = false,
  onFiltersChange,
}: FilterDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  const update = useCallback(
    (patch: Partial<ActiveFilters>) => {
      onFiltersChange({ ...activeFilters, ...patch });
    },
    [activeFilters, onFiltersChange],
  );

  const sliderMin = PRICE_SLIDER_MIN;
  const sliderMax = Math.max(filterConfig.maxPrice || 0, PRICE_SLIDER_MAX);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtry">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="fixed inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-3">
          <h2 className="font-display text-xl font-semibold tracking-wide text-brand-800">
            Filtry
          </h2>
          <div className="flex items-center gap-3">
            {hasClearableNonCategoryFilters(activeFilters) && (
              <button
                type="button"
                onClick={() => onFiltersChange(clearNonCategoryFilters(activeFilters))}
                className="text-sm text-brand-400 underline underline-offset-2"
              >
                Wyczyść
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 p-1 text-brand-500 hover:text-brand-800"
              aria-label="Zamknij filtry"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Kategoria */}
          <section>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-800">Kategoria</p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_PILLS.map((pill) => {
                const isActive = (activeFilters.pill ?? "all") === pill.value;
                return (
                  <Chip
                    key={pill.value}
                    active={isActive}
                    onClick={() => {
                      const nextPill = pill.value === "all" ? undefined : pill.value;
                      onFiltersChange({
                        ...activeFilters,
                        pill: nextPill,
                        ...(defaultListingCategoryId
                          ? { category: defaultListingCategoryId }
                          : {}),
                      });
                    }}
                  >
                    {pill.label}
                  </Chip>
                );
              })}
            </div>
          </section>

          {/* Cena — suwak */}
          <section>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-800">Cena</p>
            <div className="grid w-full min-w-0 grid-cols-1 gap-3">
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
          </section>

          {/* Materiał */}
          {filterConfig.materials.length > 0 && (
            <section>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-800">Materiał</p>
              <div className="flex flex-wrap gap-2">
                {filterConfig.materials.map((mat) => (
                  <Chip
                    key={mat}
                    active={activeFilters.materials.includes(mat)}
                    onClick={() => update({ materials: toggle(activeFilters.materials, mat) })}
                  >
                    {mat}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {/* Wykończenie */}
          {filterConfig.finishes.length > 0 && (
            <section>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-800">Wykończenie</p>
              <div className="flex flex-wrap gap-2">
                {filterConfig.finishes.map((fin) => (
                  <Chip
                    key={fin}
                    active={activeFilters.finishes.includes(fin)}
                    onClick={() => update({ finishes: toggle(activeFilters.finishes, fin) })}
                  >
                    {fin}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {/* LED */}
          {filterConfig.hasLed && (
            <section>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-800">Podświetlenie LED</p>
              <div className="flex gap-2">
                <Chip
                  active={activeFilters.led === true}
                  onClick={() => update({ led: activeFilters.led === true ? undefined : true })}
                >
                  Z LED
                </Chip>
                <Chip
                  active={activeFilters.led === false}
                  onClick={() => update({ led: activeFilters.led === false ? undefined : false })}
                >
                  Bez LED
                </Chip>
              </div>
            </section>
          )}

          {/* Rozmiar */}
          {filterConfig.sizes.length > 0 && (
            <section>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-800">Rozmiar</p>
              <div className="flex flex-wrap gap-2">
                {filterConfig.sizes.map((size) => (
                  <Chip
                    key={size}
                    active={activeFilters.sizes.includes(size)}
                    onClick={() => update({ sizes: toggle(activeFilters.sizes, size) })}
                  >
                    {size}
                  </Chip>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-brand-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-brand-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            {catalogLoading ? "Zastosuj" : `Pokaż ${resultCountLabel(resultCount)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
