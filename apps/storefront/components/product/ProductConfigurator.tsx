"use client";

import Image from "next/image";
import { ColorStepPanel } from "./ColorStepPanel";
import { FileUploadSection, type UploadedFile } from "./FileUploadSection";
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
  uploadsCount?: number;
  uploadedFiles?: UploadedFile[];
  onUploadedFilesChange?: (files: UploadedFile[]) => void;
  globalColors?: GlobalConfigOption[];
  colorOptionTitles?: string[];
  colorMap?: Record<string, string>;
  coloredSet?: Set<string>;
  mirrorSet?: Set<string>;
  matDisabledSet?: Set<string>;
  /** URL grafiki-schematu pokazywanej nad polami tekstowymi jako legenda personalizacji. */
  schemaImageUrl?: string | null;
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
  uploadsCount = 0,
  uploadedFiles = [],
  onUploadedFilesChange,
  globalColors = [],
  colorOptionTitles = [],
  colorMap = {},
  coloredSet = new Set(),
  mirrorSet = new Set(),
  matDisabledSet = new Set(),
  schemaImageUrl,
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
    <div className="space-y-4">
      {colorOptions.length > 0 && (
        <div className="space-y-1">
          <div className="space-y-0">
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

      {/* Schema image — legenda personalizacji */}
      {schemaImageUrl && textFields.length > 0 && (
        <div className="mx-auto max-w-xs">
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wider text-brand-500">
            Schemat personalizacji
          </p>
          <div className="relative aspect-square w-full overflow-hidden border border-brand-200">
            <Image
              src={schemaImageUrl}
              alt="Schemat personalizacji produktu"
              fill
              className="object-contain"
              sizes="320px"
            />
          </div>
        </div>
      )}

      {/* Text fields / notes */}
      {textFields.length > 0 && onTextFieldChange && (
        <div className="space-y-4">
          {textFields.map((field) => {
            const value = textFieldValues[field.key] ?? "";
            const max = field.maxLength ?? 200;
            const inputId = `tf-${field.key}`;
            return (
              <div key={field.key}>
                <label
                  htmlFor={inputId}
                  className="mb-1 block text-[12px] italic leading-snug text-brand-500"
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-0.5 not-italic text-red-500">*</span>
                  )}
                </label>
                {field.hint && (
                  <p className="mb-2 text-[11px] leading-snug text-brand-400">
                    {field.hint}
                  </p>
                )}
                {field.multiline ? (
                  <textarea
                    id={inputId}
                    value={value}
                    onChange={(e) => onTextFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder ?? "W uwagach prosimy o wpisanie treści, która ma być zawarta na przedmiocie"}
                    rows={5}
                    maxLength={max}
                    required={field.required}
                    className={`w-full resize-none border px-3 py-2.5 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                      field.required && !value.trim()
                        ? "border-red-300 focus:border-red-400"
                        : "border-brand-300 focus:border-brand-500"
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
                    className={`w-full border px-3 py-2.5 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                      field.required && !value.trim()
                        ? "border-red-300 focus:border-red-400"
                        : "border-brand-300 focus:border-brand-500"
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

      {/* File uploads */}
      {uploadsCount > 0 && onUploadedFilesChange && (
        <FileUploadSection
          maxFiles={Math.min(uploadsCount, 5)}
          files={uploadedFiles}
          onFilesChange={onUploadedFilesChange}
        />
      )}

      {/* QR link inputs */}
      {linksCount > 0 && onLinksChange && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-700">
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
                className={`w-full rounded border px-3 py-2.5 text-sm text-brand-700 placeholder:text-brand-400 focus:outline-none transition-colors ${
                  links[i]?.trim()
                    ? "border-brand-300 focus:border-brand-500"
                    : "border-red-300 focus:border-red-400"
                }`}
                required
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
