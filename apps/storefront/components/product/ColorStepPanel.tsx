"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CUSTOM_COLOR_VALUE,
  isMatAllowed,
  isMirrorColor,
} from "./ProductVariantSelector";
import {
  ColorSelectDropdown,
  type ColorSelectGroup,
} from "./ColorSelectDropdown";

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
}: ColorStepPanelProps) {
  const [hexInput, setHexInput] = useState(customColor ?? "#000000");
  const colorInputRef = useRef<HTMLInputElement>(null);
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
  const showIndividualGroup = customNamedColors.length > 0 || allowCustomColor;
  const matAllowed = isCustomSelected || isMatAllowed(selectedColor, matDisabledSet);

  const selectId = `color-select-${option.id}-${uniqueId.replace(/:/g, "")}`;

  const colorGroups: ColorSelectGroup[] = [
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
    }
    if (raw !== CUSTOM_COLOR_VALUE && !isMatAllowed(raw, matDisabledSet)) {
      onMatFinishChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
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
          className="w-[min(100%,16rem)] shrink-0"
        />
      </div>

      {isCustomSelected && (
        <div className="flex flex-wrap items-center gap-3 pl-0 sm:pl-0">
          <p className="w-full text-xs text-brand-500">
            Wybierz odcień lub wpisz kod HEX.
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-brand-200/80 bg-brand-50/60 px-3 py-2.5 shadow-sm">
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-full border border-brand-300 shadow-sm ring-1 ring-inset ring-black/5"
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
              className="w-24 border-0 border-b border-brand-300 bg-transparent px-1 py-1 font-mono text-sm text-brand-800 focus:border-brand-600 focus:outline-none"
              maxLength={7}
            />
            <span className="text-xs text-brand-400">HEX</span>
          </div>
        </div>
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
