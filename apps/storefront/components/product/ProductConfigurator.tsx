"use client";

import { useCallback, useState } from "react";
import { ColorStepPanel } from "./ColorStepPanel";
import { ConfiguratorPreview } from "./ConfiguratorPreview";
import {
  CUSTOM_COLOR_VALUE,
  isColorOption,
  isMatAllowed,
  isSizeOption,
  isLedOption,
  type ProductOption,
} from "./ProductVariantSelector";

export interface ColorRegion {
  name: string;
  maskUrl: string;
}

export interface ColorCustomization {
  customColor: string | null;
  matFinish: boolean;
}

interface ProductConfiguratorProps {
  options: ProductOption[];
  selectedOptions: Record<string, string>;
  onOptionChange: (optionTitle: string, value: string) => void;
  colorCustomizations: Record<string, ColorCustomization>;
  onColorCustomizationChange: (
    optionTitle: string,
    field: "customColor" | "matFinish",
    value: string | boolean | null,
  ) => void;
  customText: string;
  onCustomTextChange: (text: string) => void;
  linksCount?: number;
  links?: string[];
  onLinksChange?: (links: string[]) => void;
  baseImageUrl?: string | null;
  colorRegions?: ColorRegion[];
}

function extractColorKey(title: string): string {
  const lower = title.toLowerCase();
  if (lower === "kolor") return "kolor";
  return lower.replace(/^kolor\s+/, "");
}

export function ProductConfigurator({
  options,
  selectedOptions,
  onOptionChange,
  colorCustomizations,
  onColorCustomizationChange,
  customText,
  onCustomTextChange,
  linksCount = 0,
  links = [],
  onLinksChange,
  baseImageUrl,
  colorRegions,
}: ProductConfiguratorProps) {
  const colorOptions = options.filter((o) => isColorOption(o.title));
  const nonColorOptions = options.filter((o) => !isColorOption(o.title));

  const selectedColors: Record<string, string> = {};
  for (const opt of colorOptions) {
    const key = extractColorKey(opt.title);
    const val = selectedOptions[opt.title] ?? "";
    const cust = colorCustomizations[opt.title];
    if (val === CUSTOM_COLOR_VALUE && cust?.customColor) {
      selectedColors[key] = cust.customColor;
    } else {
      selectedColors[key] = val;
    }
  }

  const hasPreview = baseImageUrl && colorRegions && colorRegions.length > 0;
  const hasMultipleColors = colorOptions.length > 1;

  return (
    <div className="space-y-6">
      {/* Preview (only when masks are available) */}
      {hasPreview && (
        <ConfiguratorPreview
          baseImageUrl={baseImageUrl}
          colorRegions={colorRegions}
          selectedColors={selectedColors}
        />
      )}

      {/* Color options as accordion steps */}
      {colorOptions.length > 0 && (
        <div className={hasMultipleColors ? "space-y-3" : "space-y-5"}>
          {hasMultipleColors && (
            <h3 className="text-xs font-medium uppercase tracking-widest text-brand-400">
              Konfiguracja kolorów
            </h3>
          )}
          <div className="space-y-2">
            {colorOptions.map((option, idx) => {
              const cust = colorCustomizations[option.title] ?? {
                customColor: null,
                matFinish: false,
              };
              return (
                <ColorStepPanel
                  key={option.id}
                  option={option}
                  selectedColor={selectedOptions[option.title] ?? ""}
                  onColorChange={(value) => {
                    onOptionChange(option.title, value);
                    if (value !== CUSTOM_COLOR_VALUE) {
                      onColorCustomizationChange(
                        option.title,
                        "customColor",
                        null,
                      );
                    }
                    if (!isMatAllowed(value)) {
                      onColorCustomizationChange(
                        option.title,
                        "matFinish",
                        false,
                      );
                    }
                  }}
                  customColor={cust.customColor}
                  onCustomColorChange={(hex) =>
                    onColorCustomizationChange(
                      option.title,
                      "customColor",
                      hex,
                    )
                  }
                  matFinish={cust.matFinish}
                  onMatFinishChange={(enabled) =>
                    onColorCustomizationChange(
                      option.title,
                      "matFinish",
                      enabled,
                    )
                  }
                  defaultExpanded={idx === 0}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Non-color options */}
      {nonColorOptions.map((option) => {
        if (isSizeOption(option.title)) {
          return (
            <fieldset key={option.id}>
              <legend className="mb-2 text-sm font-medium text-brand-700">
                {option.title}
              </legend>
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
              <legend className="mb-2 text-sm font-medium text-brand-700">
                {option.title}
              </legend>
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
            <legend className="mb-2 text-sm font-medium text-brand-700">
              {option.title}
            </legend>
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

      {/* Links (QR codes etc.) */}
      {linksCount > 0 && onLinksChange && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-brand-700">
              Linki do kodów QR{" "}
              <span className="text-red-500">*</span>
            </p>
            <p className="mt-0.5 text-xs text-brand-400">
              Podaj {linksCount === 1 ? "adres URL" : `${linksCount} adresy URL`}, {linksCount === 1 ? "który" : "które"} mają być zakodowane w QR
            </p>
          </div>
          {Array.from({ length: linksCount }).map((_, i) => (
            <div key={i}>
              <label
                htmlFor={`link-${i}`}
                className="mb-1 block text-xs font-medium text-brand-500"
              >
                Link {linksCount > 1 ? `#${i + 1}` : ""}
              </label>
              <input
                id={`link-${i}`}
                type="url"
                value={links[i] ?? ""}
                onChange={(e) => {
                  const next = [...links];
                  next[i] = e.target.value;
                  onLinksChange(next);
                }}
                placeholder="https://..."
                className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                  links[i]?.trim()
                    ? "border-brand-200 focus:border-accent"
                    : "border-red-300 focus:border-red-400"
                }`}
                required
              />
            </div>
          ))}
        </div>
      )}

      {/* Custom text */}
      <div>
        <label
          htmlFor="custom-text"
          className="mb-2 block text-sm font-medium text-brand-700"
        >
          Twój tekst{" "}
          <span className="font-normal text-brand-400">(opcjonalnie)</span>
        </label>
        <textarea
          id="custom-text"
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          placeholder="Wpisz treść, np. nazwę salonu, imię…"
          rows={2}
          maxLength={200}
          className="w-full resize-none rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:border-accent focus:outline-none"
        />
        {customText.length > 0 && (
          <p className="mt-1 text-right text-xs text-brand-400">
            {customText.length}/200
          </p>
        )}
      </div>
    </div>
  );
}
