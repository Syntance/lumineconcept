"use client";

import { useCallback } from "react";
import type { ActiveFilters } from "./filter-types";
import { SORT_OPTIONS, clearFilters, formatPricePLN } from "./filter-types";

interface SortBarProps {
  /**
   * Opcjonalnie: root listy (bez `?kat=`) — tylko do licznika plakietki
   * „Filtry” na mobile, gdy aktywna jest węższa podkategoria.
   */
  defaultListingCategoryId?: string;
  activeFilters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  onOpenDrawer: () => void;
}

type SortBarDesktopChipsProps = Omit<SortBarProps, "onOpenDrawer">;

interface ActiveChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Aktywne filtry (chip z ×) — bez kategorii / pigułek; wybór kategorii widać
 * w bocznym filtrze, nie w tagach pod sortowaniem.
 */
function buildActiveChips(
  activeFilters: ActiveFilters,
  update: (patch: Partial<ActiveFilters>) => void,
): ActiveChip[] {
  const chips: ActiveChip[] = [];

  for (const size of activeFilters.sizes) {
    chips.push({
      key: `size-${size}`,
      label: `Rozmiar: ${size}`,
      onRemove: () =>
        update({ sizes: activeFilters.sizes.filter((s) => s !== size) }),
    });
  }

  for (const mat of activeFilters.materials) {
    chips.push({
      key: `mat-${mat}`,
      label: `Materiał: ${mat}`,
      onRemove: () =>
        update({ materials: activeFilters.materials.filter((m) => m !== mat) }),
    });
  }

  for (const fin of activeFilters.finishes) {
    chips.push({
      key: `fin-${fin}`,
      label: `Wykończenie: ${fin}`,
      onRemove: () =>
        update({ finishes: activeFilters.finishes.filter((f) => f !== fin) }),
    });
  }

  if (activeFilters.led !== undefined) {
    chips.push({
      key: "led",
      label: activeFilters.led ? "Z LED" : "Bez LED",
      onRemove: () => update({ led: undefined }),
    });
  }

  if (activeFilters.priceMin !== undefined || activeFilters.priceMax !== undefined) {
    const minLabel = activeFilters.priceMin ? formatPricePLN(activeFilters.priceMin) : "0 PLN";
    const maxLabel = activeFilters.priceMax ? formatPricePLN(activeFilters.priceMax) : "∞";
    chips.push({
      key: "price",
      label: `${minLabel} – ${maxLabel}`,
      onRemove: () => update({ priceMin: undefined, priceMax: undefined }),
    });
  }

  return chips;
}

/** Pasek sortowania + Filtry — tylko mobile (lg:hidden). */
export function SortBarMobile({
  defaultListingCategoryId,
  activeFilters,
  onFiltersChange,
  onOpenDrawer,
}: SortBarProps) {
  const update = useCallback(
    (patch: Partial<ActiveFilters>) => {
      onFiltersChange({ ...activeFilters, ...patch });
    },
    [activeFilters, onFiltersChange],
  );

  const chips = buildActiveChips(activeFilters, update);
  const pillOn = !!activeFilters.pill && activeFilters.pill !== "all";
  const subcatOn = Boolean(
    defaultListingCategoryId &&
      activeFilters.category &&
      activeFilters.category !== defaultListingCategoryId,
  );
  const activeCount = chips.length + (pillOn ? 1 : 0) + (subcatOn ? 1 : 0);

  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-brand-100 bg-white/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
      <div className="flex items-center gap-3">
        <select
          value={activeFilters.sort}
          onChange={(e) => update({ sort: e.target.value })}
          className="rounded-md border border-brand-200 bg-white px-3 py-1.5 text-sm text-brand-800"
          aria-label="Sortowanie"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="flex-1" />
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center gap-1.5 rounded-md border border-brand-200 px-3 py-1.5 text-sm text-brand-800 transition-colors hover:bg-brand-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtry
          {activeCount > 0 && (
            <span className="flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-800 px-0.5 text-[10px] font-bold tabular-nums leading-none text-white ring-2 ring-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/** Aktywne chipy filtrów — tylko desktop (hidden lg:flex). */
export function SortBarDesktopChips({
  activeFilters,
  onFiltersChange,
}: SortBarDesktopChipsProps) {
  const update = useCallback(
    (patch: Partial<ActiveFilters>) => {
      onFiltersChange({ ...activeFilters, ...patch });
    },
    [activeFilters, onFiltersChange],
  );

  const chips = buildActiveChips(activeFilters, update);

  if (chips.length === 0) return null;

  return (
    <div className="hidden flex-wrap items-center gap-1.5 lg:flex">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] text-brand-800 transition-colors hover:bg-brand-200"
        >
          {chip.label}
          <span className="text-brand-400">&times;</span>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => onFiltersChange(clearFilters(activeFilters.sort, activeFilters.pill))}
          className="text-[11px] text-brand-400 underline underline-offset-2 hover:text-brand-800"
        >
          Wyczyść
        </button>
      )}
    </div>
  );
}
