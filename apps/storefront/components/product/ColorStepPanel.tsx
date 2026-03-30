"use client";

import { useState, useRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import {
  CUSTOM_COLOR_VALUE,
  COLOR_MAP,
  MIRROR_COLORS,
  isMatAllowed,
  isMirrorColor,
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
}: ColorStepPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [hexInput, setHexInput] = useState(customColor ?? "#000000");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();

  const isCustomSelected = selectedColor === CUSTOM_COLOR_VALUE;
  const standardColors = option.values.filter((v) => !isMirrorColor(v));
  const mirrorColors = option.values.filter((v) => isMirrorColor(v));
  const matAllowed = isCustomSelected || isMatAllowed(selectedColor);

  const displayName = isCustomSelected
    ? `Własny kolor${customColor ? ` (${customColor})` : ""}`
    : selectedColor || "—";
  const displaySuffix = matFinish && matAllowed ? " - mat" : "";

  const selectedHex = isCustomSelected
    ? customColor ?? "#ccc"
    : COLOR_MAP[selectedColor.toLowerCase()] ?? "#ccc";

  const filterId = `milky-blur-${uniqueId.replace(/:/g, "")}`;
  const clipId = `milky-clip-${uniqueId.replace(/:/g, "")}`;

  const renderSwatch = (value: string) => {
    const isSelected = selectedColor === value;
    const hex = COLOR_MAP[value.toLowerCase()] ?? "#ccc";
    const isTransparent =
      value.toLowerCase() === "bezbarwny" ||
      value.toLowerCase() === "przezroczysty";
    const isMilky = value.toLowerCase() === "mleczny";

    return (
      <button
        key={value}
        type="button"
        onClick={() => onColorChange(value)}
        className={`relative h-9 w-9 rounded-full border-2 transition-all overflow-hidden ${
          isSelected
            ? "border-accent ring-2 ring-accent/30"
            : "border-brand-200 hover:border-brand-400"
        }`}
        style={isMilky ? undefined : { backgroundColor: hex }}
        title={value}
        aria-pressed={isSelected}
        aria-label={value}
      >
        {isTransparent && (
          <span className="absolute inset-1 rounded-full border border-dashed border-brand-300" />
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
    );
  };

  return (
    <div className="rounded-xl border border-brand-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50"
        aria-expanded={expanded}
      >
        {/* Selected color swatch (small) */}
        <span
          className="h-6 w-6 shrink-0 rounded-full border border-brand-200"
          style={{
            backgroundColor:
              selectedHex === "transparent" ? undefined : selectedHex,
          }}
        >
          {selectedHex === "transparent" && (
            <span className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-brand-300 text-[8px] text-brand-300">
              ∅
            </span>
          )}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-700">{option.title}</p>
          <p className="text-xs text-brand-400 truncate">
            {displayName}
            {displaySuffix}
          </p>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-brand-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-brand-100 px-4 pb-4 pt-3">
            {standardColors.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-brand-400">
                  Standard
                </p>
                <div className="flex flex-wrap gap-2">
                  {standardColors.map(renderSwatch)}
                </div>
              </div>
            )}

            {mirrorColors.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-brand-400">
                  Lustrzane
                </p>
                <div className="flex flex-wrap gap-2">
                  {mirrorColors.map(renderSwatch)}
                </div>
              </div>
            )}

            {/* Custom color */}
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-brand-400">
                Indywidualny
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
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-dashed border-brand-300 hover:border-brand-400"
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-brand-200"
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
                  className="w-24 rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-mono text-brand-700 focus:border-accent focus:outline-none"
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
                className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  !matAllowed
                    ? "cursor-not-allowed border-brand-100 bg-brand-50 text-brand-300"
                    : matFinish
                      ? "border-accent bg-accent/10 font-medium text-accent-dark"
                      : "border-brand-200 text-brand-700 hover:border-brand-400"
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
                    matFinish && matAllowed ? "bg-accent" : "bg-brand-200"
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
                  <span className="text-[10px] font-normal text-brand-300">
                    (niedostępne)
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
