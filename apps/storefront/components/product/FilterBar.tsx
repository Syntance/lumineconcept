"use client";

import { useCallback, useState } from "react";

export interface FilterConfig {
  colors: string[];
  sizes: string[];
  hasLed: boolean;
  minPrice: number;
  maxPrice: number;
}

export interface ActiveFilters {
  category?: string;
  sort: string;
  colors: string[];
  led?: boolean;
  priceMin?: number;
  priceMax?: number;
  sizes: string[];
}

interface FilterBarProps {
  categories: Array<{ id: string; name: string }>;
  activeFilters: ActiveFilters;
  filterConfig: FilterConfig;
  resultCount: number;
  onFiltersChange: (filters: ActiveFilters) => void;
}

const SORT_OPTIONS = [
  { value: "-created_at", label: "Najnowsze" },
  { value: "title", label: "Nazwa A-Z" },
  { value: "-title", label: "Nazwa Z-A" },
] as const;

const PRICE_RANGES = [
  { label: "Do 100 PLN", min: 0, max: 10000 },
  { label: "100–200 PLN", min: 10000, max: 20000 },
  { label: "200–300 PLN", min: 20000, max: 30000 },
  { label: "300+ PLN", min: 30000, max: Infinity },
] as const;

const COLOR_MAP: Record<string, string> = {
  czarny: "#1a1a1a",
  biały: "#ffffff",
  złoty: "#D4AF37",
  "rose gold": "#B76E79",
  srebrny: "#C0C0C0",
  przezroczysty: "transparent",
  różowy: "#E8A0BF",
  beżowy: "#D4C5B2",
  szary: "#8B8B8B",
  brązowy: "#6B4226",
};

export function FilterBar({
  categories,
  activeFilters,
  filterConfig,
  resultCount,
  onFiltersChange,
}: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const update = useCallback(
    (patch: Partial<ActiveFilters>) => {
      onFiltersChange({ ...activeFilters, ...patch });
    },
    [activeFilters, onFiltersChange],
  );

  const toggleColor = (color: string) => {
    const next = activeFilters.colors.includes(color)
      ? activeFilters.colors.filter((c) => c !== color)
      : [...activeFilters.colors, color];
    update({ colors: next });
  };

  const toggleSize = (size: string) => {
    const next = activeFilters.sizes.includes(size)
      ? activeFilters.sizes.filter((s) => s !== size)
      : [...activeFilters.sizes, size];
    update({ sizes: next });
  };

  const activeChips: Array<{ label: string; onRemove: () => void }> = [];
  if (activeFilters.category) {
    const cat = categories.find((c) => c.id === activeFilters.category);
    activeChips.push({
      label: cat?.name ?? activeFilters.category,
      onRemove: () => update({ category: undefined }),
    });
  }
  for (const color of activeFilters.colors) {
    activeChips.push({ label: color, onRemove: () => toggleColor(color) });
  }
  for (const size of activeFilters.sizes) {
    activeChips.push({ label: `Rozmiar: ${size}`, onRemove: () => toggleSize(size) });
  }
  if (activeFilters.led !== undefined) {
    activeChips.push({ label: "LED", onRemove: () => update({ led: undefined }) });
  }
  if (activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined) {
    const range = PRICE_RANGES.find(
      (r) => r.min === activeFilters.priceMin && (r.max === activeFilters.priceMax || (r.max === Infinity && !activeFilters.priceMax)),
    );
    activeChips.push({
      label: range?.label ?? "Cena",
      onRemove: () => update({ priceMin: undefined, priceMax: undefined }),
    });
  }

  const clearAll = () => {
    onFiltersChange({
      sort: activeFilters.sort,
      colors: [],
      sizes: [],
      category: undefined,
      led: undefined,
      priceMin: undefined,
      priceMax: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Category pills + sort */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => update({ category: undefined })}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            !activeFilters.category
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
            onClick={() => update({ category: cat.id })}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeFilters.category === cat.id
                ? "bg-brand-900 text-white"
                : "border border-brand-200 text-brand-600 hover:bg-brand-50"
            }`}
          >
            {cat.name}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-1.5 rounded-md border border-brand-200 px-3 py-1.5 text-xs text-brand-700 transition-colors hover:bg-brand-50"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtry
          </button>
          <select
            value={activeFilters.sort}
            onChange={(e) => update({ sort: e.target.value })}
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

      {/* Expanded filters panel */}
      {filtersOpen && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-5 space-y-5">
          {/* Colors */}
          {filterConfig.colors.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-600">Kolor</p>
              <div className="flex flex-wrap gap-2">
                {filterConfig.colors.map((color) => {
                  const hex = COLOR_MAP[color.toLowerCase()] ?? "#ccc";
                  const isActive = activeFilters.colors.includes(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleColor(color)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                        isActive
                          ? "border-accent bg-accent/10 text-accent-dark font-medium"
                          : "border-brand-200 text-brand-600 hover:border-brand-300"
                      }`}
                      title={color}
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-brand-200"
                        style={{ backgroundColor: hex }}
                      />
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* LED */}
          {filterConfig.hasLed && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-600">Podświetlenie LED</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => update({ led: activeFilters.led === true ? undefined : true })}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                    activeFilters.led === true
                      ? "border-accent bg-accent/10 text-accent-dark"
                      : "border-brand-200 text-brand-600 hover:border-brand-300"
                  }`}
                >
                  Z LED
                </button>
                <button
                  type="button"
                  onClick={() => update({ led: activeFilters.led === false ? undefined : false })}
                  className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                    activeFilters.led === false
                      ? "border-accent bg-accent/10 text-accent-dark"
                      : "border-brand-200 text-brand-600 hover:border-brand-300"
                  }`}
                >
                  Bez LED
                </button>
              </div>
            </div>
          )}

          {/* Price ranges */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-600">Cena</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((range) => {
                const isActive =
                  activeFilters.priceMin === range.min &&
                  (range.max === Infinity ? !activeFilters.priceMax : activeFilters.priceMax === range.max);
                return (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        update({ priceMin: undefined, priceMax: undefined });
                      } else {
                        update({
                          priceMin: range.min,
                          priceMax: range.max === Infinity ? undefined : range.max,
                        });
                      }
                    }}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-accent bg-accent/10 text-accent-dark"
                        : "border-brand-200 text-brand-600 hover:border-brand-300"
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sizes */}
          {filterConfig.sizes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-brand-600">Rozmiar</p>
              <div className="flex flex-wrap gap-2">
                {filterConfig.sizes.map((size) => {
                  const isActive = activeFilters.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "border-accent bg-accent/10 text-accent-dark"
                          : "border-brand-200 text-brand-600 hover:border-brand-300"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active filter chips + count */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-brand-500">
          Znaleziono {resultCount} {resultCount === 1 ? "produkt" : resultCount < 5 ? "produkty" : "produktów"}
        </span>
        {activeChips.length > 0 && (
          <>
            <span className="text-brand-300">·</span>
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onRemove}
                className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] text-brand-700 transition-colors hover:bg-brand-200"
              >
                {chip.label}
                <span className="text-brand-400">&times;</span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] text-brand-400 underline underline-offset-2 hover:text-brand-600"
            >
              Wyczyść wszystkie
            </button>
          </>
        )}
      </div>
    </div>
  );
}
