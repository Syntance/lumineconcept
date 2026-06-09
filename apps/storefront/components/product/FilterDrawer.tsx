"use client";

import { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import type { ActiveFilters, FilterConfig } from "./filter-types";
import {
  clearNonCategoryFilters,
  hasClearableNonCategoryFilters,
  resultCountLabel,
} from "./filter-types";
import { PriceRangeFilter } from "./PriceRangeFilter";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultListingCategoryId: string;
  categoryFilters: Array<{ id: string; handle: string; name: string }>;
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
  categoryFilters,
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
              <Chip
                active={
                  activeFilters.category === defaultListingCategoryId ||
                  !activeFilters.category
                }
                onClick={() =>
                  onFiltersChange({
                    ...activeFilters,
                    category: defaultListingCategoryId,
                    pill: undefined,
                  })
                }
              >
                Wszystkie
              </Chip>
              {categoryFilters.map((cat) => (
                <Chip
                  key={cat.id}
                  active={activeFilters.category === cat.id}
                  onClick={() =>
                    onFiltersChange({
                      ...activeFilters,
                      category: cat.id,
                      pill: undefined,
                    })
                  }
                >
                  {cat.name}
                </Chip>
              ))}
            </div>
          </section>

          {/* Cena */}
          <section>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-800">Cena</p>
            <PriceRangeFilter
              activeFilters={activeFilters}
              catalogMaxPrice={filterConfig.maxPrice}
              onFiltersChange={(patch) => update(patch)}
            />
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
