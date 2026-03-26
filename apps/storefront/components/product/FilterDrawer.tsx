"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { ActiveFilters, FilterConfig } from "./filter-types";
import {
  COLOR_MAP,
  TAG_OPTIONS,
  PRICE_SLIDER_MIN,
  PRICE_SLIDER_MAX,
  PRICE_STEP,
  clearFilters,
  formatPricePLN,
  hasAnyActiveFilter,
  resultCountLabel,
} from "./filter-types";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string }>;
  activeFilters: ActiveFilters;
  filterConfig: FilterConfig;
  resultCount: number;
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
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border border-accent bg-accent/10 text-accent-dark"
          : "border border-brand-200 text-brand-600"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterDrawer({
  isOpen,
  onClose,
  categories,
  activeFilters,
  filterConfig,
  resultCount,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtry">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="fixed inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-brand-800">Filtry</h2>
          <div className="flex items-center gap-3">
            {hasAnyActiveFilter(activeFilters) && (
              <button
                type="button"
                onClick={() => onFiltersChange(clearFilters(activeFilters.sort))}
                className="text-xs text-brand-400 underline underline-offset-2"
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
          {categories.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Kategoria</p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={!activeFilters.category}
                  onClick={() => update({ category: undefined })}
                >
                  Wszystkie
                </Chip>
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    active={activeFilters.category === cat.id}
                    onClick={() => update({ category: cat.id })}
                  >
                    {cat.name}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {/* Cena — suwak */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Cena</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-brand-500">
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
          </section>

          {/* Kolor */}
          {filterConfig.colors.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Kolor</p>
              <div className="flex flex-wrap gap-2">
                {filterConfig.colors.map((color) => {
                  const hex = COLOR_MAP[color.toLowerCase()] ?? "#ccc";
                  const isActive = activeFilters.colors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => update({ colors: toggle(activeFilters.colors, color) })}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        isActive
                          ? "border-accent bg-accent/10 text-accent-dark font-medium"
                          : "border-brand-200 text-brand-600"
                      }`}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 rounded-full border border-brand-200"
                        style={{ backgroundColor: hex }}
                      />
                      {color}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Materiał */}
          {filterConfig.materials.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Materiał</p>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Wykończenie</p>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Podświetlenie LED</p>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Rozmiar</p>
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

          {/* Dostępność */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Dostępność</p>
            <div className="flex gap-2">
              <Chip
                active={activeFilters.availability === "in_stock"}
                onClick={() => update({ availability: activeFilters.availability === "in_stock" ? undefined : "in_stock" })}
              >
                W magazynie
              </Chip>
              <Chip
                active={activeFilters.availability === "on_order"}
                onClick={() => update({ availability: activeFilters.availability === "on_order" ? undefined : "on_order" })}
              >
                Na zamówienie
              </Chip>
            </div>
          </section>

          {/* Cechy / Tagi */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-800">Cechy</p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((tag) => (
                <Chip
                  key={tag.value}
                  active={activeFilters.tags.includes(tag.value)}
                  onClick={() => update({ tags: toggle(activeFilters.tags, tag.value) })}
                >
                  {tag.label}
                </Chip>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-brand-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md bg-brand-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Pokaż {resultCountLabel(resultCount)}
          </button>
        </div>
      </div>
    </div>
  );
}
