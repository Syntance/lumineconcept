"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { PriceDisplay } from "./PriceDisplay";
import {
  CUSTOM_COLOR_VALUE,
  getColorHex,
  isEveryColorOptionChosen,
  isMatAllowed,
  isMirrorColor,
  isColorOption,
} from "./ProductVariantSelector";
import { parseTextFieldsFromMetadata } from "@/lib/products/text-fields";
import type { GlobalConfigOption } from "@/lib/products/global-config";

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
  matDisabledSet,
}: {
  label: string;
  values: string[];
  state: ColorState;
  onChange: (s: ColorState) => void;
  colorMap: Record<string, string>;
  coloredSet: Set<string>;
  mirrorSet: Set<string>;
  matDisabledSet: Set<string>;
}) {
  const uniqueId = useId();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [hexInput, setHexInput] = useState(state.customHex ?? "#000000");

  const standard = values.filter(
    (v) => !isMirrorColor(v, mirrorSet) && !coloredSet.has(v.toLowerCase()),
  );
  const colored = values.filter((v) => coloredSet.has(v.toLowerCase()));
  const mirror = values.filter((v) => isMirrorColor(v, mirrorSet));
  const isCustom = state.selected === CUSTOM_COLOR_VALUE;
  const matAllowed = isCustom || isMatAllowed(state.selected, matDisabledSet);

  const filterId = `mini-blur-${uniqueId.replace(/:/g, "")}`;
  const clipId = `mini-clip-${uniqueId.replace(/:/g, "")}`;

  const renderSwatch = (value: string) => {
    const isSelected = state.selected === value;
    const hex = getColorHex(value, colorMap);
    const isTransparent = value.toLowerCase() === "bezbarwny" || value.toLowerCase() === "przezroczysty";
    const isMilky = value.toLowerCase() === "mleczny";

    return (
      <div key={value} className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={() => {
            const next = { ...state, selected: value };
            if (
              value !== CUSTOM_COLOR_VALUE &&
              !isMatAllowed(value, matDisabledSet)
            ) {
              next.matFinish = false;
            }
            onChange(next);
          }}
          className={`relative h-8 w-8 shrink-0 rounded-full border-2 transition-all overflow-hidden ${
            isSelected ? "border-accent ring-2 ring-accent/30" : "border-brand-200 hover:border-brand-400"
          }`}
          style={isMilky ? undefined : { backgroundColor: hex }}
          title={value}
          aria-pressed={isSelected}
        >
          {isTransparent && <span className="absolute inset-0.5 rounded-full border border-dashed border-brand-300" />}
          {isMilky && (
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36">
              <defs>
                <clipPath id={clipId}><circle cx="18" cy="18" r="17" /></clipPath>
                <filter id={filterId}><feGaussianBlur stdDeviation="2.5" /></filter>
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
        <span className="max-w-[3.75rem] text-center text-[8px] leading-tight text-brand-500">
          {value}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-brand-600">{label}</p>

      {standard.length > 0 && (
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-brand-400">Standardowe</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1.5">{standard.map(renderSwatch)}</div>
        </div>
      )}
      {colored.length > 0 && (
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-brand-400">Kolorowe</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1.5">{colored.map(renderSwatch)}</div>
        </div>
      )}
      {mirror.length > 0 && (
        <div>
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-brand-400">Lustrzane</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1.5">{mirror.map(renderSwatch)}</div>
        </div>
      )}

      <div>
        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-brand-400">Indywidualny</p>
        <p className="mb-1.5 text-[9px] leading-snug text-brand-500/85">Własny odcień lub kod HEX.</p>
        <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            onChange({ ...state, selected: CUSTOM_COLOR_VALUE, customHex: state.customHex ?? hexInput });
          }}
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
            isCustom ? "border-accent ring-2 ring-accent/30" : "border-dashed border-brand-300 hover:border-brand-400"
          }`}
          style={{
            background: isCustom && state.customHex
              ? state.customHex
              : "conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
          }}
          title="Własny kolor"
          aria-pressed={isCustom}
        >
          {!isCustom && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-600">+</span>}
        </button>

        {isCustom && (
          <>
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border border-brand-200"
              style={{ backgroundColor: state.customHex ?? hexInput }}
            >
              <input
                ref={colorInputRef}
                type="color"
                value={state.customHex ?? hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  onChange({ ...state, customHex: e.target.value });
                }}
                className="sr-only"
                tabIndex={-1}
              />
            </button>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => {
                setHexInput(e.target.value);
                if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                  onChange({ ...state, customHex: e.target.value });
                }
              }}
              placeholder="#000000"
              className="w-20 rounded-md border border-brand-200 px-2 py-1 text-xs font-mono text-brand-700 focus:border-accent focus:outline-none"
              maxLength={7}
            />
          </>
        )}
        </div>
      </div>

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

  const globalColorNames = useMemo(
    () => globalColors.map((c) => c.name),
    [globalColors],
  );

  const colorOptionEntries = useMemo(() => {
    const fromOptions = Object.entries(options).filter(([key]) => isColorOption(key));
    if (fromOptions.length > 0) {
      return fromOptions.map(([key, vals]) => [key, globalColors.length > 0 ? globalColorNames : vals] as [string, string[]]);
    }
    if (globalColors.length > 0) {
      return [["Kolor", globalColorNames] as [string, string[]]];
    }
    return [];
  }, [options, globalColors, globalColorNames]);

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
  }, [colorStates, textFields, textFieldValues, links, linksCount]);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      const metadata = buildMetadata();
      await addItemWithTracking(
        variantId,
        { id: productId, title, price, currency: "PLN" },
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
              colorMap={colorMap}
              coloredSet={coloredSet}
              mirrorSet={mirrorSet}
              matDisabledSet={matDisabledSet}
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
                    links[i]?.trim() ? "border-brand-200 focus:border-accent" : "border-red-300 focus:border-red-400"
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
                      <textarea
                        value={value}
                        onChange={(e) =>
                          setTextFieldValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder ?? ""}
                        rows={2}
                        maxLength={max}
                        className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                          field.required && !value.trim()
                            ? "border-red-300 focus:border-red-400"
                            : "border-brand-200 focus:border-accent"
                        }`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setTextFieldValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder ?? ""}
                        maxLength={max}
                        className={`w-full rounded-lg border px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none transition-colors ${
                          field.required && !value.trim()
                            ? "border-red-300 focus:border-red-400"
                            : "border-brand-200 focus:border-accent"
                        }`}
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
