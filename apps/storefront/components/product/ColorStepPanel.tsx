"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { CustomHexColorPicker } from "./CustomHexColorPicker";
import { isValidHex } from "@/lib/color/hex";
import {
  CUSTOM_COLOR_VALUE,
  isMatAllowed,
  isMatAllowedForSelection,
  isMirrorColor,
} from "./ProductVariantSelector";
import {
  ColorSelectDropdown,
  type ColorSelectGroup,
} from "./ColorSelectDropdown";
import type { ColorCategoryDefinition } from "@/lib/products/color-categories";

/** Etykieta jak na makiecie: „KOLOR TABLICZKI :” */
export function formatColorOptionLabel(title: string): string {
  const t = title.trim();
  if (!t) return "";
  const noColon = t.replace(/:\s*$/, "").trim();
  return `${noColon.toUpperCase()} :`;
}

interface ColorStepPanelProps {
  option: { id: string; title: string; values: string[] };
  selectedColor: string;
  onColorChange: (value: string) => void;
  customColor: string | null;
  onCustomColorChange: (hex: string) => void;
  matFinish: boolean;
  onMatFinishChange: (enabled: boolean) => void;
  colorMap: Record<string, string>;
  coloredSet: Set<string>;
  mirrorSet: Set<string>;
  customSet?: Set<string>;
  matDisabledSet: Set<string>;
  allowCustomColor?: boolean;
  customCategoryEnabled?: boolean;
  colorCategories?: ColorCategoryDefinition[];
  categoryByColorName?: Record<string, string>;
}

function buildDynamicColorGroups(
  values: string[],
  categories: ColorCategoryDefinition[],
  categoryByColorName: Record<string, string>,
  allowCustomColor: boolean,
  customCategoryEnabled: boolean,
): ColorSelectGroup[] {
  const groups: ColorSelectGroup[] = [];

  for (const category of categories) {
    if (category.id === "custom" && !customCategoryEnabled) continue;

    const categoryValues = values.filter(
      (value) => categoryByColorName[value.toLowerCase()] === category.id,
    );

    if (category.id === "custom") {
      if (categoryValues.length === 0 && !allowCustomColor) continue;
      groups.push({
        label: category.label,
        options: [
          ...categoryValues.map((value) => ({ value, label: value })),
          ...(allowCustomColor
            ? [{ value: CUSTOM_COLOR_VALUE, label: "Własny kolor (HEX)" }]
            : []),
        ],
      });
      continue;
    }

    if (categoryValues.length === 0) continue;
    groups.push({
      label: category.label,
      options: categoryValues.map((value) => ({ value, label: value })),
    });
  }

  return groups;
}

export function ColorStepPanel({
  option,
  selectedColor,
  onColorChange,
  customColor,
  onCustomColorChange,
  matFinish,
  onMatFinishChange,
  colorMap,
  coloredSet,
  mirrorSet,
  customSet = new Set(),
  matDisabledSet,
  allowCustomColor = true,
  customCategoryEnabled = true,
  colorCategories,
  categoryByColorName,
}: ColorStepPanelProps) {
  const [hexInput, setHexInput] = useState(customColor ?? "#000000");
  const uniqueId = useId();

  const isCustomSelected = selectedColor === CUSTOM_COLOR_VALUE;
  const standardColors = option.values.filter(
    (v) =>
      !isMirrorColor(v, mirrorSet) &&
      !coloredSet.has(v.toLowerCase()) &&
      !customSet.has(v.toLowerCase()),
  );
  const coloredColors = option.values.filter((v) => coloredSet.has(v.toLowerCase()));
  const mirrorColors = option.values.filter((v) => isMirrorColor(v, mirrorSet));
  const customNamedColors = option.values.filter((v) => customSet.has(v.toLowerCase()));
  const showIndividualGroup =
    customCategoryEnabled && (customNamedColors.length > 0 || allowCustomColor);
  const matAllowed = isMatAllowedForSelection(selectedColor, matDisabledSet, {
    customHex: customColor,
    colorMap,
  });

  const selectId = `color-select-${option.id}-${uniqueId.replace(/:/g, "")}`;

  const colorGroups: ColorSelectGroup[] =
    colorCategories && categoryByColorName
      ? buildDynamicColorGroups(
          option.values,
          colorCategories,
          categoryByColorName,
          allowCustomColor,
          customCategoryEnabled,
        )
      : [
          ...(standardColors.length > 0
            ? [{ label: "Standardowe", options: standardColors.map((c) => ({ value: c, label: c })) }]
            : []),
          ...(coloredColors.length > 0
            ? [{ label: "Kolorowe", options: coloredColors.map((c) => ({ value: c, label: c })) }]
            : []),
          ...(mirrorColors.length > 0
            ? [{ label: "Lustrzane", options: mirrorColors.map((c) => ({ value: c, label: c })) }]
            : []),
          ...(showIndividualGroup
            ? [
                {
                  label: "Indywidualny",
                  options: [
                    ...customNamedColors.map((c) => ({ value: c, label: c })),
                    ...(allowCustomColor
                      ? [{ value: CUSTOM_COLOR_VALUE, label: "Własny kolor (HEX)" }]
                      : []),
                  ],
                },
              ]
            : []),
        ];

  useEffect(() => {
    setHexInput(customColor ?? "#000000");
  }, [customColor]);

  const handleSelectChange = (raw: string) => {
    if (raw === "") {
      onColorChange("");
      onMatFinishChange(false);
      return;
    }
    onColorChange(raw);
    if (raw === CUSTOM_COLOR_VALUE) {
      const base = customColor ?? hexInput;
      if (/^#[0-9a-fA-F]{6}$/.test(base)) {
        onCustomColorChange(base);
      }
      if (
        !isMatAllowedForSelection(CUSTOM_COLOR_VALUE, matDisabledSet, {
          customHex: base,
          colorMap,
        })
      ) {
        onMatFinishChange(false);
      }
    }
    if (raw !== CUSTOM_COLOR_VALUE && !isMatAllowed(raw, matDisabledSet)) {
      onMatFinishChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <label
          htmlFor={selectId}
          className="shrink-0 text-sm font-bold uppercase leading-none tracking-[0.08em] text-brand-800"
        >
          {formatColorOptionLabel(option.title)}
        </label>
        <ColorSelectDropdown
          id={selectId}
          value={selectedColor === "" ? "" : selectedColor}
          onChange={handleSelectChange}
          groups={colorGroups}
          colorMap={colorMap}
          className="w-[min(100%,13.5rem)]"
        />
      </div>

      {isCustomSelected && (
        <CustomHexColorPicker
          value={customColor ?? (isValidHex(hexInput) ? hexInput : "#000000")}
          onChange={(hex) => {
            setHexInput(hex);
            onCustomColorChange(hex);
            if (
              !isMatAllowedForSelection(CUSTOM_COLOR_VALUE, matDisabledSet, {
                customHex: hex,
                colorMap,
              })
            ) {
              onMatFinishChange(false);
            }
          }}
          size="md"
        />
      )}

      <div>
        <button
          type="button"
          onClick={() => matAllowed && onMatFinishChange(!matFinish)}
          disabled={!matAllowed}
          className={cn(
            "flex items-center gap-2.5 border-0 border-b border-transparent pb-2 text-sm transition-colors",
            !matAllowed
              ? "cursor-not-allowed text-brand-500"
              : matFinish
                ? "font-medium text-brand-800"
                : "text-brand-700 hover:border-brand-300",
          )}
          aria-pressed={matFinish}
          title={
            matAllowed
              ? "Wykończenie matowe"
              : "Niedostępne dla tego koloru"
          }
        >
          <span
            className={cn(
              "inline-flex h-4 w-7 items-center rounded-full transition-colors",
              matFinish && matAllowed ? "bg-brand-600" : "bg-brand-200",
            )}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
                matFinish && matAllowed ? "translate-x-3.5" : "translate-x-0.5",
              )}
            />
          </span>
          Mat
          {!matAllowed && (
            <span className="text-xs font-normal text-brand-500">
              (niedostępne dla tego koloru)
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
