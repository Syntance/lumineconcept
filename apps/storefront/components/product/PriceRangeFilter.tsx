"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import type { ActiveFilters } from "./filter-types";
import {
  PRICE_RANGE_INPUT_CLASS,
  PRICE_RANGE_INNER_CLASS,
  PRICE_RANGE_ROW_CLASS,
  PRICE_RANGE_TRACK_ACTIVE_CLASS,
  PRICE_RANGE_TRACK_IDLE_CLASS,
  PRICE_SLIDER_MAX,
  PRICE_SLIDER_MIN,
  PRICE_STEP,
  clampPriceRange,
  priceFilterPatch,
  priceRangeActiveTrackStyle,
} from "./filter-types";

const PRICE_INPUT_CLASS =
  "h-9 w-full min-w-0 rounded-md border border-brand-200 bg-white px-2 py-1 text-sm tabular-nums text-brand-800 outline-none focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

type PriceRangeFilterProps = {
  activeFilters: ActiveFilters;
  catalogMaxPrice: number;
  onFiltersChange: (patch: Pick<ActiveFilters, "priceMin" | "priceMax">) => void;
};

export function PriceRangeFilter({
  activeFilters,
  catalogMaxPrice,
  onFiltersChange,
}: PriceRangeFilterProps) {
  const sliderMin = PRICE_SLIDER_MIN;
  const sliderMax = Math.max(catalogMaxPrice, PRICE_SLIDER_MAX);
  const [localMin, setLocalMin] = useState(activeFilters.priceMin ?? sliderMin);
  const [localMax, setLocalMax] = useState(activeFilters.priceMax ?? sliderMax);

  useEffect(() => {
    setLocalMin(activeFilters.priceMin ?? sliderMin);
    setLocalMax(activeFilters.priceMax ?? sliderMax);
  }, [activeFilters.priceMin, activeFilters.priceMax, sliderMin, sliderMax]);

  const commitPrice = (nextMin = localMin, nextMax = localMax) => {
    const { min, max } = clampPriceRange(nextMin, nextMax, sliderMin, sliderMax);
    setLocalMin(min);
    setLocalMax(max);
    onFiltersChange(priceFilterPatch(min, max, sliderMin, sliderMax));
  };

  const handlePriceKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 pt-1">
      <div className="flex min-w-0 w-full items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="sr-only">Cena od</span>
          <input
            type="number"
            inputMode="numeric"
            min={sliderMin}
            max={sliderMax}
            step={PRICE_STEP}
            value={localMin}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) setLocalMin(v);
            }}
            onBlur={() => commitPrice()}
            onKeyDown={handlePriceKeyDown}
            className={PRICE_INPUT_CLASS}
            aria-label="Cena od"
          />
          <span className="shrink-0 text-xs text-brand-500">PLN</span>
        </label>
        <span className="shrink-0 text-brand-300" aria-hidden>
          –
        </span>
        <label className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="sr-only">Cena do</span>
          <input
            type="number"
            inputMode="numeric"
            min={sliderMin}
            max={sliderMax}
            step={PRICE_STEP}
            value={localMax}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) setLocalMax(v);
            }}
            onBlur={() => commitPrice()}
            onKeyDown={handlePriceKeyDown}
            className={PRICE_INPUT_CLASS}
            aria-label="Cena do"
          />
          <span className="shrink-0 text-xs text-brand-500">PLN</span>
        </label>
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
            onMouseUp={() => commitPrice()}
            onTouchEnd={() => commitPrice()}
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
            onMouseUp={() => commitPrice()}
            onTouchEnd={() => commitPrice()}
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
  );
}
