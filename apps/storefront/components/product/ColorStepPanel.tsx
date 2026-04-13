"use client";

import { useState, useRef, useId } from "react";
import { cn } from "@/lib/utils";
import {
  CUSTOM_COLOR_VALUE,
  getColorHex,
  isMirrorColor,
  isMatAllowed,
} from "./ProductVariantSelector";

interface ColorStepPanelProps {
  option: { id: string; title: string; values: string[] };
  selectedColor: string;
  onColorChange: (value: string) => void;
  customColor: string | null;
  onCustomColorChange: (hex: string) => void;
  matFinish: boolean;
  onMatFinishChange: (enabled: boolean) => void;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  showNextButton?: boolean;
  onNext?: () => void;
  nextButtonLabel?: string;
  colorMap: Record<string, string>;
  coloredSet: Set<string>;
  mirrorSet: Set<string>;
  matDisabledSet: Set<string>;
}

export function ColorStepPanel({
  option,
  selectedColor,
  onColorChange,
  customColor,
  onCustomColorChange,
  matFinish,
  onMatFinishChange,
  defaultExpanded = false,
  expanded,
  onExpandedChange,
  showNextButton = false,
  onNext,
  nextButtonLabel = "Następny \u2192",
  colorMap,
  coloredSet,
  mirrorSet,
  matDisabledSet,
}: ColorStepPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [hexInput, setHexInput] = useState(customColor ?? "#000000");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();
  const isExpanded = expanded ?? internalExpanded;

  const isCustomSelected = selectedColor === CUSTOM_COLOR_VALUE;
  const standardColors = option.values.filter(
    (v) => !isMirrorColor(v, mirrorSet) && !coloredSet.has(v.toLowerCase()),
  );
  const coloredColors = option.values.filter((v) => coloredSet.has(v.toLowerCase()));
  const mirrorColors = option.values.filter((v) => isMirrorColor(v, mirrorSet));
  const matAllowed = isCustomSelected || isMatAllowed(selectedColor, matDisabledSet);

  const displayName = isCustomSelected
    ? `Własny kolor${customColor ? ` (${customColor})` : ""}`
    : selectedColor || "—";
  const displaySuffix = matFinish && matAllowed ? " - mat" : "";

  const selectedHex = isCustomSelected
    ? customColor ?? "#ccc"
    : getColorHex(selectedColor, colorMap);

  const filterId = `milky-blur-${uniqueId.replace(/:/g, "")}`;
  const clipId = `milky-clip-${uniqueId.replace(/:/g, "")}`;

  const renderSwatch = (value: string) => {
    const isSelected = selectedColor === value;
    const hex = getColorHex(value, colorMap);
    const isTransparent =
      value.toLowerCase() === "bezbarwny" ||
      value.toLowerCase() === "przezroczysty";
    const isMilky = value.toLowerCase() === "mleczny";

    return (
      <div
        key={value}
        className={cn(
          "flex flex-col items-center gap-1 rounded-lg p-1 transition-colors",
          isSelected && "bg-brand-50",
        )}
      >
        <button
          type="button"
          onClick={() => onColorChange(value)}
          className={`relative h-9 w-9 shrink-0 rounded-full border-2 transition-all overflow-hidden ${
            isSelected
              ? "border-[#AF7C61] ring-2 ring-[#AF7C61]/30"
              : "border-[#AF7C61]/50 hover:border-[#AF7C61]"
          }`}
          style={isMilky ? undefined : { backgroundColor: hex }}
          title={value}
          aria-pressed={isSelected}
          aria-label={value}
        >
          {isTransparent && (
            <span className="absolute inset-1 rounded-full border border-dashed border-[#AF7C61]/50" />
          )}
          {isMilky && (
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36">
              <defs>
                <clipPath id={clipId}>
                  <circle cx="18" cy="18" r="17" />
                </clipPath>
                <filter id={filterId}>
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
              </defs>
              <g clipPath={`url(#${clipId})`}>
                <rect width="36" height="36" fill="#F5F0E8" />
                <line x1="-10" y1="46" x2="14" y2="-10" stroke="#000" strokeWidth="2.5" filter={`url(#${filterId})`} />
                <line x1="2" y1="46" x2="26" y2="-10" stroke="#000" strokeWidth="2.5" filter={`url(#${filterId})`} />
                <line x1="14" y1="46" x2="38" y2="-10" stroke="#000" strokeWidth="2.5" filter={`url(#${filterId})`} />
                <line x1="26" y1="46" x2="50" y2="-10" stroke="#000" strokeWidth="2.5" filter={`url(#${filterId})`} />
                <rect width="36" height="36" fill="rgba(245,240,232,0.25)" />
              </g>
            </svg>
          )}
        </button>
        <span className="max-w-18 text-center text-xs leading-tight text-brand-500">
          {value}
        </span>
      </div>
    );
  };

  return (
    <div>
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-3 pb-4 pt-3 mt-1">
            {standardColors.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
                  Standardowe
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                  {standardColors.map(renderSwatch)}
                </div>
              </div>
            )}

            {coloredColors.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
                  Kolorowe
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                  {coloredColors.map(renderSwatch)}
                </div>
              </div>
            )}

            {mirrorColors.length > 0 && (
              <div>
                <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
                  Lustrzane
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                  {mirrorColors.map(renderSwatch)}
                </div>
              </div>
            )}

            {/* Custom color */}
            <div>
              <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">
                Indywidualny
              </p>
              <p className="mb-2 text-xs leading-snug text-brand-500/85">
                Dowolny odcień — wybierz kolor lub wpisz kod HEX poniżej.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onColorChange(CUSTOM_COLOR_VALUE);
                    if (!customColor) {
                      onCustomColorChange(hexInput);
                    }
                  }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                    isCustomSelected
                      ? "border-[#AF7C61] ring-2 ring-[#AF7C61]/30"
                      : "border-dashed border-[#AF7C61]/50 hover:border-[#AF7C61]"
                  }`}
                  style={{
                    background:
                      isCustomSelected && customColor
                        ? customColor
                        : "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                  }}
                  title="Własny kolor"
                  aria-pressed={isCustomSelected}
                  aria-label="Własny kolor"
                >
                  {!isCustomSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-600">
                      +
                    </span>
                  )}
                </button>
              </div>
            </div>

            {isCustomSelected && (
              <div className="flex items-center gap-3 rounded-lg bg-brand-50 px-2 py-2">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-none border border-[#AF7C61]/50"
                  style={{ backgroundColor: customColor ?? hexInput }}
                  aria-label="Wybierz kolor"
                >
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={customColor ?? hexInput}
                    onChange={(e) => {
                      const hex = e.target.value;
                      setHexInput(hex);
                      onCustomColorChange(hex);
                    }}
                    className="sr-only"
                    tabIndex={-1}
                  />
                </button>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHexInput(val);
                    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                      onCustomColorChange(val);
                    }
                  }}
                  placeholder="#000000"
                  className="w-24 rounded-none border border-[#AF7C61]/50 bg-white px-3 py-1.5 text-sm font-mono text-brand-700 focus:border-[#AF7C61] focus:outline-none"
                  maxLength={7}
                />
                <span className="text-xs text-brand-400">Wpisz kod HEX</span>
              </div>
            )}

            {/* Mat finish toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => matAllowed && onMatFinishChange(!matFinish)}
                disabled={!matAllowed}
                className={`flex items-center gap-2.5 rounded-none border px-4 py-2.5 text-sm transition-colors ${
                  !matAllowed
                    ? "cursor-not-allowed border-[#AF7C61]/50 bg-brand-50 text-brand-600"
                    : matFinish
                      ? "border-[#AF7C61] bg-[#AF7C61]/10 font-medium text-accent-dark"
                      : "border-[#AF7C61]/50 text-brand-700 hover:border-[#AF7C61]"
                }`}
                aria-pressed={matFinish}
                title={
                  matAllowed
                    ? "Wykończenie matowe"
                    : "Niedostępne dla tego koloru"
                }
              >
                <span
                  className={`inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    matFinish && matAllowed ? "bg-[#AF7C61]" : "bg-brand-200"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                      matFinish && matAllowed
                        ? "translate-x-3.5"
                        : "translate-x-0.5"
                    }`}
                  />
                </span>
                Mat
                {!matAllowed && (
                  <span className="text-xs font-normal text-brand-700">
                    (niedostępne dla tego koloru)
                  </span>
                )}
              </button>
            </div>

            {showNextButton && onNext && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (expanded === undefined) {
                      setInternalExpanded(false);
                    } else {
                      onExpandedChange?.(false);
                    }
                    onNext();
                  }}
                  className="w-full rounded-none border border-[#AF7C61]/50 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:border-[#AF7C61] hover:bg-brand-50"
                >
                  {nextButtonLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
