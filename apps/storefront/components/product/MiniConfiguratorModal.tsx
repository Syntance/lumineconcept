"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "./PriceDisplay";
import { CustomHexColorPicker } from "./CustomHexColorPicker";
import { formatColorOptionLabel } from "./ColorStepPanel";
import { isValidHex } from "@/lib/color/hex";
import {
  ColorSelectDropdown,
  type ColorSelectGroup,
} from "./ColorSelectDropdown";
import {
  CUSTOM_COLOR_VALUE,
  isEveryColorOptionChosen,
  isMatAllowed,
  isMirrorColor,
} from "./ProductVariantSelector";
import { parseTextFieldsFromMetadata } from "@/lib/products/text-fields";
import { AutoGrowTextarea } from "./AutoGrowTextarea";
import {
  buildColorMap,
  buildColoredSet,
  buildCustomSet,
  buildMirrorSet,
  mergeGlobalAndProductColors,
  parseAllowCustomColor,
  type GlobalConfigOption,
} from "@/lib/products/global-config";
import {
  flattenProductColorsForSlot,
  getEnabledColorNamesForSlot,
  parseAllowCustomColorBySlot,
  parseDisabledColorCategoriesBySlot,
  parseDisabledConfigIds,
  parseDisabledConfigIdsBySlot,
  parseProductColorsBySlot,
  resolveColorSlotTitles,
  resolveAllowCustomColorForSlot,
  isColorCategoryEnabledForSlot,
} from "@/lib/products/color-slot-config";

interface MiniConfiguratorModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  variantId: string;
  title: string;
  price: number;
  thumbnail: string | null;
  options: Record<string, string[]>;
  linksCount?: number;
  href?: string;
  metadata?: Record<string, unknown>;
  globalColors?: GlobalConfigOption[];
  colorMap?: Record<string, string>;
  coloredSet?: Set<string>;
  mirrorSet?: Set<string>;
  matDisabledSet?: Set<string>;
}

interface ColorState {
  selected: string;
  customHex: string | null;
  matFinish: boolean;
}

function ColorPicker({
  label,
  values,
  state,
  onChange,
  colorMap,
  coloredSet,
  mirrorSet,
  customSet,
  matDisabledSet,
  allowCustomColor = true,
  customCategoryEnabled = true,
}: {
  label: string;
  values: string[];
  state: ColorState;
  onChange: (s: ColorState) => void;
  colorMap: Record<string, string>;
  coloredSet: Set<string>;
  mirrorSet: Set<string>;
  customSet: Set<string>;
  matDisabledSet: Set<string>;
  allowCustomColor?: boolean;
  customCategoryEnabled?: boolean;
}) {
  const uniqueId = useId();
  const [hexInput, setHexInput] = useState(state.customHex ?? "#000000");

  useEffect(() => {
    setHexInput(state.customHex ?? "#000000");
  }, [state.customHex]);

  const standard = values.filter(
    (v) =>
      !isMirrorColor(v, mirrorSet) &&
      !coloredSet.has(v.toLowerCase()) &&
      !customSet.has(v.toLowerCase()),
  );
  const colored = values.filter((v) => coloredSet.has(v.toLowerCase()));
  const mirror = values.filter((v) => isMirrorColor(v, mirrorSet));
  const customNamed = values.filter((v) => customSet.has(v.toLowerCase()));
  const showIndividualGroup =
    customCategoryEnabled && (customNamed.length > 0 || allowCustomColor);
  const isCustom = state.selected === CUSTOM_COLOR_VALUE;
  const matAllowed = isCustom || isMatAllowed(state.selected, matDisabledSet);

  const selectId = `mini-color-${label}-${uniqueId.replace(/:/g, "")}`;

  const colorGroups: ColorSelectGroup[] = [
    ...(standard.length > 0
      ? [{ label: "Standardowe", options: standard.map((c) => ({ value: c, label: c })) }]
      : []),
    ...(colored.length > 0
      ? [{ label: "Kolorowe", options: colored.map((c) => ({ value: c, label: c })) }]
      : []),
    ...(mirror.length > 0
      ? [{ label: "Lustrzane", options: mirror.map((c) => ({ value: c, label: c })) }]
      : []),
    ...(showIndividualGroup
      ? [
          {
            label: "Indywidualny",
            options: [
              ...customNamed.map((c) => ({ value: c, label: c })),
              ...(allowCustomColor
                ? [{ value: CUSTOM_COLOR_VALUE, label: "Własny kolor (HEX)" }]
                : []),
            ],
          },
        ]
      : []),
  ];

  const applySelect = (raw: string) => {
    if (raw === "") {
      onChange({ ...state, selected: "", customHex: null, matFinish: false });
      return;
    }
    const next: ColorState = {
      ...state,
      selected: raw,
      customHex:
        raw === CUSTOM_COLOR_VALUE
          ? state.customHex ?? (/^#[0-9a-fA-F]{6}$/.test(hexInput) ? hexInput : null)
          : null,
    };
    if (raw !== CUSTOM_COLOR_VALUE && !isMatAllowed(raw, matDisabledSet)) {
      next.matFinish = false;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <label
          htmlFor={selectId}
          className="shrink-0 text-xs font-bold uppercase leading-none tracking-[0.08em] text-brand-800"
        >
          {formatColorOptionLabel(label)}
        </label>
        <ColorSelectDropdown
          id={selectId}
          value={state.selected === "" ? "" : state.selected}
          onChange={applySelect}
          groups={colorGroups}
          colorMap={colorMap}
          size="sm"
          className="w-[min(100%,12rem)]"
        />
      </div>

      {isCustom && (
        <CustomHexColorPicker
          value={
            state.customHex ?? (isValidHex(hexInput) ? hexInput : "#000000")
          }
          onChange={(hex) => {
            setHexInput(hex);
            onChange({ ...state, customHex: hex });
          }}
          size="sm"
        />
      )}

      <button
        type="button"
        onClick={() => matAllowed && onChange({ ...state, matFinish: !state.matFinish })}
        disabled={!matAllowed}
        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${
          !matAllowed
            ? "cursor-not-allowed border-brand-100 bg-brand-50 text-brand-600"
            : state.matFinish
              ? "border-accent bg-accent/10 font-medium text-accent-dark"
              : "border-brand-200 text-brand-700 hover:border-brand-400"
        }`}
        aria-pressed={state.matFinish}
        title={
          matAllowed
            ? "Wykończenie matowe"
            : "Niedostępne dla tego koloru"
        }
      >
        <span className={`inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${state.matFinish && matAllowed ? "bg-accent" : "bg-brand-200"}`}>
          <span className={`h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform ${state.matFinish && matAllowed ? "translate-x-3" : "translate-x-0.5"}`} />
        </span>
        Mat
        {!matAllowed && (
          <span className="text-[10px] font-normal text-brand-700">
            (niedostępne dla tego koloru)
          </span>
        )}
      </button>
    </div>
  );
}

export function MiniConfiguratorModal({
  open,
  onClose,
  productId,
  variantId,
  title,
  price,
  thumbnail,
  options,
  linksCount = 0,
  href,
  metadata,
  globalColors = [],
  colorMap = {},
  coloredSet = new Set(),
  mirrorSet = new Set(),
  matDisabledSet = new Set(),
}: MiniConfiguratorModalProps) {
  const { addItemWithTracking } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [links, setLinks] = useState<string[]>(() =>
    Array.from({ length: linksCount }, () => ""),
  );
  const allLinksProvided = linksCount === 0 || links.slice(0, linksCount).every((l) => l.trim().length > 0);

  const textFields = useMemo(
    () => parseTextFieldsFromMetadata(metadata),
    [metadata],
  );
  const [textFieldValues, setTextFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setTextFieldValues((prev) => {
      const next: Record<string, string> = {};
      for (const f of textFields) next[f.key] = prev[f.key] ?? "";
      return next;
    });
  }, [textFields]);

  const allTextFieldsValid = useMemo(() => {
    return textFields
      .filter((f) => f.required)
      .every((f) => (textFieldValues[f.key] ?? "").trim().length > 0);
  }, [textFields, textFieldValues]);

  const optionTitles = useMemo(
    () => Object.keys(options).map((title) => ({ title })),
    [options],
  );

  const colorOptionTitles = useMemo(
    () => resolveColorSlotTitles(optionTitles, metadata),
    [optionTitles, metadata],
  );

  const productColorsBySlot = useMemo(
    () => parseProductColorsBySlot(metadata, colorOptionTitles),
    [metadata, colorOptionTitles],
  );

  const legacyDisabledIds = useMemo(
    () => parseDisabledConfigIds(metadata),
    [metadata],
  );

  const legacyColorDisabledIds = useMemo(() => {
    const colorIds = new Set(globalColors.map((c) => c.id));
    return legacyDisabledIds.filter((id) => colorIds.has(id));
  }, [legacyDisabledIds, globalColors]);

  const disabledConfigIdsBySlot = useMemo(
    () =>
      parseDisabledConfigIdsBySlot(
        metadata,
        colorOptionTitles,
        legacyColorDisabledIds,
      ),
    [metadata, colorOptionTitles, legacyColorDisabledIds],
  );

  const disabledColorCategoriesBySlot = useMemo(
    () => parseDisabledColorCategoriesBySlot(metadata, colorOptionTitles),
    [metadata, colorOptionTitles],
  );

  const allowCustomColorBySlot = useMemo(
    () =>
      parseAllowCustomColorBySlot(
        metadata,
        colorOptionTitles,
        parseAllowCustomColor(metadata),
      ),
    [metadata, colorOptionTitles],
  );

  const mergedColors = useMemo(() => {
    const allProductColors = colorOptionTitles.flatMap((title) =>
      flattenProductColorsForSlot(productColorsBySlot[title]),
    );
    return mergeGlobalAndProductColors(globalColors, allProductColors);
  }, [globalColors, colorOptionTitles, productColorsBySlot]);

  const resolvedColorMap = useMemo(
    () => (Object.keys(colorMap).length > 0 ? colorMap : buildColorMap(mergedColors)),
    [colorMap, mergedColors],
  );

  const resolvedColoredSet = useMemo(
    () => (coloredSet.size > 0 ? coloredSet : buildColoredSet(mergedColors)),
    [coloredSet, mergedColors],
  );

  const resolvedMirrorSet = useMemo(
    () => (mirrorSet.size > 0 ? mirrorSet : buildMirrorSet(mergedColors)),
    [mirrorSet, mergedColors],
  );

  const resolvedCustomSet = useMemo(() => buildCustomSet(mergedColors), [mergedColors]);

  const colorOptionEntries = useMemo(() => {
    return colorOptionTitles.map(
      (title) =>
        [
          title,
          getEnabledColorNamesForSlot(
            title,
            globalColors,
            flattenProductColorsForSlot(productColorsBySlot[title]),
            disabledConfigIdsBySlot,
            disabledColorCategoriesBySlot,
          ),
        ] as [string, string[]],
    );
  }, [
    colorOptionTitles,
    globalColors,
    productColorsBySlot,
    disabledConfigIdsBySlot,
    disabledColorCategoriesBySlot,
  ]);

  const initialColors: Record<string, ColorState> = {};
  for (const [key] of colorOptionEntries) {
    initialColors[key] = { selected: "", customHex: null, matFinish: false };
  }

  const [colorStates, setColorStates] = useState<Record<string, ColorState>>(initialColors);

  const allColorChoicesComplete = useMemo(() => {
    const titles = colorOptionEntries.map(([t]) => t);
    const sel: Record<string, string> = {};
    const cust: Record<string, { customColor: string | null }> = {};
    for (const t of titles) {
      const cs = colorStates[t];
      sel[t] = cs?.selected ?? "";
      cust[t] = { customColor: cs?.customHex ?? null };
    }
    return isEveryColorOptionChosen(titles, sel, cust);
  }, [colorOptionEntries, colorStates]);

  const updateColor = useCallback((optionTitle: string, state: ColorState) => {
    setColorStates((prev) => ({ ...prev, [optionTitle]: state }));
  }, []);

  const buildMetadata = useCallback(() => {
    const meta: Record<string, string> = {};
    for (const [optKey, cs] of Object.entries(colorStates)) {
      const key = optKey.toLowerCase().replace(/^kolor\s*/, "").replace(/\s+/g, "_") || "kolor";
      if (cs.selected && cs.selected !== CUSTOM_COLOR_VALUE) {
        meta[`color_${key}`] = cs.selected;
        const hex = colorMap[cs.selected.toLowerCase()];
        if (hex) meta[`color_${key}_hex`] = hex;
      }
      if (cs.selected === CUSTOM_COLOR_VALUE && cs.customHex) {
        meta[`color_${key}_custom`] = cs.customHex;
      }
      if (cs.matFinish) {
        meta[`color_${key}_mat`] = "true";
      }
    }
    for (const field of textFields) {
      const val = textFieldValues[field.key]?.trim();
      if (val) meta[`text_${field.key}`] = val;
    }
    for (let i = 0; i < linksCount; i++) {
      const url = links[i]?.trim();
      if (url) meta[`link_${i + 1}`] = url;
    }
    return meta;
  }, [colorStates, textFields, textFieldValues, links, linksCount, resolvedColorMap]);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const metadata = buildMetadata();
      await addItemWithTracking(
        variantId,
        {
          id: productId,
          title,
          price,
          currency: "PLN",
          thumbnail: thumbnail ?? undefined,
        },
        1,
        Object.keys(metadata).length > 0 ? metadata : undefined,
      );
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            onClose();
          }
        }}
        role="presentation"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3 border-b border-brand-100 px-5 py-4">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title}
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-brand-800 line-clamp-2">{title}</h3>
            <div className="mt-0.5">
              <PriceDisplay amount={price} currency="PLN" size="md" />
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="shrink-0 rounded-full p-1.5 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-600"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {colorOptionEntries.map(([optionTitle, values]) => (
            <ColorPicker
              key={optionTitle}
              label={optionTitle}
              values={values}
              state={
                colorStates[optionTitle] ?? {
                  selected: "",
                  customHex: null,
                  matFinish: false,
                }
              }
              onChange={(s) => updateColor(optionTitle, s)}
              colorMap={resolvedColorMap}
              coloredSet={resolvedColoredSet}
              mirrorSet={resolvedMirrorSet}
              customSet={resolvedCustomSet}
              matDisabledSet={matDisabledSet}
              allowCustomColor={resolveAllowCustomColorForSlot(
                allowCustomColorBySlot,
                optionTitle,
                parseAllowCustomColor(metadata),
                disabledColorCategoriesBySlot,
              )}
              customCategoryEnabled={isColorCategoryEnabledForSlot(
                disabledColorCategoriesBySlot,
                optionTitle,
              )}
            />
          ))}

          {linksCount > 0 && (
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-brand-600">
                  Linki do kodów QR <span className="text-red-500">*</span>
                </p>
                <p className="mt-0.5 text-[10px] text-brand-400">
                  {linksCount === 1 ? "Podaj adres URL" : `Podaj ${linksCount} adresy URL`} do zakodowania w QR
                </p>
              </div>
              {Array.from({ length: linksCount }).map((_, i) => (
                <input
                  key={i}
                  type="url"
                  value={links[i] ?? ""}
                  onChange={(e) => {
                    const next = [...links];
                    next[i] = e.target.value;
                    setLinks(next);
                  }}
                  placeholder={`Link ${linksCount > 1 ? `#${i + 1}` : ""} — https://...`}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                    links[i]?.trim()
                      ? "border-brand-200 bg-brand-50 focus:border-accent"
                      : "border-red-300 bg-white focus:border-red-400"
                  }`}
                  required
                />
              ))}
            </div>
          )}

          {textFields.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-brand-600">Personalizacja tekstu</p>
              {textFields.map((field) => {
                const value = textFieldValues[field.key] ?? "";
                const max = field.maxLength ?? 200;
                return (
                  <div key={field.key}>
                    <label className="mb-1 block text-[11px] font-medium text-brand-600">
                      {field.label}
                      {field.required ? (
                        <span className="ml-0.5 text-red-500">*</span>
                      ) : (
                        <span className="ml-1 font-normal text-brand-400">(opcjonalnie)</span>
                      )}
                    </label>
                    {field.multiline ? (
                      <AutoGrowTextarea
                        value={value}
                        onChange={(e) =>
                          setTextFieldValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder ?? ""}
                        minRows={2}
                        maxLength={max}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                          field.required && !value.trim()
                            ? "border-red-300 bg-white focus:border-red-400"
                            : "border-brand-200 focus:border-accent"
                        } ${value.trim() ? "bg-brand-50" : "bg-white"}`}
                      />
                    ) : (
                      <AutoGrowTextarea
                        value={value}
                        onChange={(e) =>
                          setTextFieldValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder ?? ""}
                        minRows={1}
                        maxLength={max}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                          field.required && !value.trim()
                            ? "border-red-300 bg-white focus:border-red-400"
                            : "border-brand-200 focus:border-accent"
                        } ${value.trim() ? "bg-brand-50" : "bg-white"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-brand-100 px-5 py-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={
              isAdding ||
              !allLinksProvided ||
              !allTextFieldsValid ||
              !allColorChoicesComplete
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {isAdding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : !allLinksProvided ? (
              "Uzupełnij linki"
            ) : !allTextFieldsValid ? (
              "Uzupełnij pola tekstowe"
            ) : !allColorChoicesComplete ? (
              "Wybierz kolory"
            ) : (
              "Dodaj do koszyka"
            )}
          </button>
          {href && (
            <Link
              href={href}
              className="mt-3 block w-full text-center text-sm font-medium text-brand-800 underline-offset-2 transition-colors hover:text-accent-dark hover:underline"
              onClick={onClose}
            >
              lub przejdź do pełnej konfiguracji
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
