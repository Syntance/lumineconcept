"use client";

import { useState, useRef } from "react";

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
}

export const CUSTOM_COLOR_VALUE = "__custom__";

interface ProductVariantSelectorProps {
  options: ProductOption[];
  selectedOptions: Record<string, string>;
  onOptionChange: (optionTitle: string, value: string) => void;
  customColor?: string | null;
  onCustomColorChange?: (hex: string) => void;
  matFinish?: boolean;
  onMatFinishChange?: (enabled: boolean) => void;
}

const COLOR_MAP: Record<string, string> = {
  bezbarwny: "transparent",
  mleczny: "#F5F0E8",
  czarny: "#1a1a1a",
  biały: "#ffffff",
  złoty: "#D4AF37",
  srebrny: "#C0C0C0",
  "rose gold": "#B76E79",
  rosegold: "#B76E79",
  czerwone: "#CC0000",
  czerwony: "#CC0000",
  fioletowy: "#7B2D8E",
  zielony: "#1B6B3A",
  granatowy: "#1B2A4A",
  przezroczysty: "transparent",
  różowy: "#E8A0BF",
  beżowy: "#D4C5B2",
  szary: "#8B8B8B",
  brązowy: "#6B4226",
};

const MIRROR_COLORS = new Set([
  "złoty", "srebrny", "rose gold", "rosegold",
  "czerwone", "czerwony", "fioletowy", "zielony", "granatowy",
]);

const MAT_DISABLED_COLORS = new Set([
  "bezbarwny", "mleczny",
  ...MIRROR_COLORS,
]);

export function isMatAllowed(colorValue: string): boolean {
  return !MAT_DISABLED_COLORS.has(colorValue.toLowerCase());
}

function isMirrorColor(value: string): boolean {
  return MIRROR_COLORS.has(value.toLowerCase());
}

function isColorOption(title: string): boolean {
  return title.toLowerCase() === "kolor";
}

function isSizeOption(title: string): boolean {
  return title.toLowerCase() === "rozmiar";
}

function isLedOption(title: string): boolean {
  return title.toLowerCase() === "led";
}

export function ProductVariantSelector({
  options,
  selectedOptions,
  onOptionChange,
  customColor,
  onCustomColorChange,
  matFinish,
  onMatFinishChange,
}: ProductVariantSelectorProps) {
  const [hexInput, setHexInput] = useState(customColor ?? "#000000");
  const colorInputRef = useRef<HTMLInputElement>(null);

  const isCustomSelected = selectedOptions["Kolor"] === CUSTOM_COLOR_VALUE;
  if (options.length === 0) return null;

  return (
    <div className="space-y-5">
      {options.map((option) => {
        if (isColorOption(option.title)) {
          const standardColors = option.values.filter((v) => !isMirrorColor(v));
          const mirrorColors = option.values.filter((v) => isMirrorColor(v));

          const currentColor = selectedOptions[option.title] ?? "";
          const matAllowed =
            currentColor === CUSTOM_COLOR_VALUE || isMatAllowed(currentColor);

          const renderSwatch = (value: string) => {
            const isSelected = selectedOptions[option.title] === value;
            const hex = COLOR_MAP[value.toLowerCase()] ?? "#ccc";
            const isTransparent = value.toLowerCase() === "bezbarwny" || value.toLowerCase() === "przezroczysty";
            const isMilky = value.toLowerCase() === "mleczny";
            return (
              <button
                key={value}
                type="button"
                onClick={() => onOptionChange(option.title, value)}
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
                      <clipPath id="milky-clip">
                        <circle cx="18" cy="18" r="17" />
                      </clipPath>
                      <filter id="milky-blur">
                        <feGaussianBlur stdDeviation="2.5" />
                      </filter>
                    </defs>
                    <g clipPath="url(#milky-clip)">
                      <rect width="36" height="36" fill="#F5F0E8" />
                      <line x1="-10" y1="46" x2="14" y2="-10" stroke="#000" strokeWidth="2.5" filter="url(#milky-blur)" />
                      <line x1="2" y1="46" x2="26" y2="-10" stroke="#000" strokeWidth="2.5" filter="url(#milky-blur)" />
                      <line x1="14" y1="46" x2="38" y2="-10" stroke="#000" strokeWidth="2.5" filter="url(#milky-blur)" />
                      <line x1="26" y1="46" x2="50" y2="-10" stroke="#000" strokeWidth="2.5" filter="url(#milky-blur)" />
                      <rect width="36" height="36" fill="rgba(245,240,232,0.25)" />
                    </g>
                  </svg>
                )}
              </button>
            );
          };

          return (
            <fieldset key={option.id} className="space-y-3">
              <legend className="mb-2 text-sm font-medium text-brand-700">
                {option.title}:{" "}
                <span className="font-normal text-brand-500">
                  {currentColor === CUSTOM_COLOR_VALUE
                    ? `Własny kolor${customColor ? ` (${customColor})` : ""}${matFinish ? " - mat" : ""}`
                    : `${currentColor}${matFinish && matAllowed ? " - mat" : ""}`}
                </span>
              </legend>

              {standardColors.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-brand-400">Standard</p>
                  <div className="flex flex-wrap gap-2">
                    {standardColors.map(renderSwatch)}
                  </div>
                </div>
              )}

              {mirrorColors.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-brand-400">Lustrzane</p>
                  <div className="flex flex-wrap gap-2">
                    {mirrorColors.map(renderSwatch)}
                  </div>
                </div>
              )}

              {onCustomColorChange && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-widest text-brand-400">Indywidualny</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onOptionChange(option.title, CUSTOM_COLOR_VALUE);
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
                        background: isCustomSelected && customColor
                          ? customColor
                          : "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                      }}
                      title="Własny kolor"
                      aria-pressed={isCustomSelected}
                      aria-label="Własny kolor"
                    >
                      {!isCustomSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-600">+</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isCustomSelected && onCustomColorChange && (
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
              {onMatFinishChange && (
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
                    title={matAllowed ? "Wykończenie matowe" : "Niedostępne dla tego koloru"}
                  >
                    <span className={`inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                      matFinish && matAllowed ? "bg-accent" : "bg-brand-200"
                    }`}>
                      <span className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                        matFinish && matAllowed ? "translate-x-3.5" : "translate-x-0.5"
                      }`} />
                    </span>
                    Mat
                    {!matAllowed && (
                      <span className="text-[10px] font-normal text-brand-300">(niedostępne)</span>
                    )}
                  </button>
                </div>
              )}
            </fieldset>
          );
        }

        if (isSizeOption(option.title)) {
          return (
            <fieldset key={option.id}>
              <legend className="mb-2 text-sm font-medium text-brand-700">{option.title}</legend>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.title] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onOptionChange(option.title, value)}
                      className={`flex flex-col items-center justify-center rounded-lg border px-5 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/10 text-accent-dark font-medium"
                          : "border-brand-200 text-brand-700 hover:border-brand-400"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        }

        if (isLedOption(option.title)) {
          return (
            <fieldset key={option.id}>
              <legend className="mb-2 text-sm font-medium text-brand-700">{option.title}</legend>
              <div className="flex gap-2">
                {option.values.map((value) => {
                  const isSelected = selectedOptions[option.title] === value;
                  const isYes = value.toLowerCase() === "tak";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onOptionChange(option.title, value)}
                      className={`flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? "border-accent bg-accent/10 text-accent-dark font-medium"
                          : "border-brand-200 text-brand-700 hover:border-brand-400"
                      }`}
                      aria-pressed={isSelected}
                    >
                      {isYes && <span className="text-base">💡</span>}
                      {isYes ? "Z LED" : "Bez LED"}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        }

        return (
          <fieldset key={option.id}>
            <legend className="mb-2 text-sm font-medium text-brand-700">{option.title}</legend>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = selectedOptions[option.title] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onOptionChange(option.title, value)}
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/10 text-accent-dark font-medium"
                        : "border-brand-200 text-brand-700 hover:border-brand-400"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
