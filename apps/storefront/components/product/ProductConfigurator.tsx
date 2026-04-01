"use client";

import { ColorStepPanel } from "./ColorStepPanel";
import {
  CUSTOM_COLOR_VALUE,
  isColorOption,
  isMatAllowed,
  isSizeOption,
  isLedOption,
  type ProductOption,
} from "./ProductVariantSelector";
import type { TextFieldDef } from "@/lib/products/text-fields";
import type { GlobalConfigOption } from "@/lib/products/global-config";

export interface ColorCustomization {
  customColor: string | null;
  matFinish: boolean;
}

export type { TextFieldDef };

export interface ColorOptionFromConfig {
  id: string;
  title: string;
  values: string[];
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
  textFields?: TextFieldDef[];
  textFieldValues?: Record<string, string>;
  onTextFieldChange?: (key: string, value: string) => void;
  linksCount?: number;
  links?: string[];
  onLinksChange?: (links: string[]) => void;
  globalColors?: GlobalConfigOption[];
  colorOptionTitles?: string[];
  colorMap?: Record<string, string>;
  coloredSet?: Set<string>;
  mirrorSet?: Set<string>;
  matDisabledSet?: Set<string>;
}

export function ProductConfigurator({
  options,
  selectedOptions,
  onOptionChange,
  colorCustomizations,
  onColorCustomizationChange,
  textFields = [],
  textFieldValues = {},
  onTextFieldChange,
  linksCount = 0,
  links = [],
  onLinksChange,
  globalColors = [],
  colorOptionTitles = [],
  colorMap = {},
  coloredSet = new Set(),
  mirrorSet = new Set(),
  matDisabledSet = new Set(),
}: ProductConfiguratorProps) {
  const nonColorOptions = options.filter((o) => !isColorOption(o.title));

  const colorNames = globalColors.map((c) => c.name);

  const colorOptions: ColorOptionFromConfig[] =
    colorOptionTitles.length > 0
      ? colorOptionTitles.map((title, idx) => ({
          id: `global-color-${idx}`,
          title,
          values: colorNames,
        }))
      : options
          .filter((o) => isColorOption(o.title))
          .map((o) => ({
            id: o.id,
            title: o.title,
            values: globalColors.length > 0 ? colorNames : o.values,
          }));

  const hasMultipleColors = colorOptions.length > 1;

  return (
    <div className="space-y-6">
      {colorOptions.length > 0 && (
        <div className={hasMultipleColors ? "space-y-3" : "space-y-5"}>
          {hasMultipleColors && (
            <h3 className="font-sans text-xs font-medium uppercase tracking-widest text-[#725750]">
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
                    if (
                      value !== CUSTOM_COLOR_VALUE &&
                      !isMatAllowed(value, matDisabledSet)
                    ) {
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
                  colorMap={colorMap}
                  coloredSet={coloredSet}
                  mirrorSet={mirrorSet}
                  matDisabledSet={matDisabledSet}
                />
              );
            })}
          </div>
        </div>
      )}

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

      {textFields.length > 0 && onTextFieldChange && (
        <div className="space-y-4">
          <h3 className="font-sans text-xs font-medium uppercase tracking-widest text-[#725750]">
            Personalizacja tekstu
          </h3>
          {textFields.map((field) => {
            const value = textFieldValues[field.key] ?? "";
            const max = field.maxLength ?? 200;
            const inputId = `tf-${field.key}`;
            return (
              <div key={field.key}>
                <label
                  htmlFor={inputId}
                  className="mb-1.5 block text-sm font-medium text-brand-700"
                >
                  {field.label}
                  {field.required ? (
                    <span className="ml-0.5 text-red-500">*</span>
                  ) : (
                    <span className="ml-1 font-normal text-brand-400">(opcjonalnie)</span>
                  )}
                </label>
                {field.multiline ? (
                  <textarea
                    id={inputId}
                    value={value}
                    onChange={(e) => onTextFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder ?? ""}
                    rows={2}
                    maxLength={max}
                    required={field.required}
                    className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                      field.required && !value.trim()
                        ? "border-red-300 focus:border-red-400"
                        : "border-brand-200 focus:border-accent"
                    }`}
                  />
                ) : (
                  <input
                    id={inputId}
                    type="text"
                    value={value}
                    onChange={(e) => onTextFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder ?? ""}
                    maxLength={max}
                    required={field.required}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                      field.required && !value.trim()
                        ? "border-red-300 focus:border-red-400"
                        : "border-brand-200 focus:border-accent"
                    }`}
                  />
                )}
                {value.length > 0 && (
                  <p className="mt-1 text-right text-xs text-brand-400">
                    {value.length}/{max}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
