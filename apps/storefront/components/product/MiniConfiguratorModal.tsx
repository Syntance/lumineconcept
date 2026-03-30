"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import {
  COLOR_MAP,
  CUSTOM_COLOR_VALUE,
  MIRROR_COLORS,
  isMatAllowed,
  isMirrorColor,
  isColorOption,
} from "./ProductVariantSelector";

interface MiniConfiguratorModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  variantId: string;
  title: string;
  price: number;
  thumbnail: string | null;
  options: Record<string, string[]>;
  href?: string;
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
}: {
  label: string;
  values: string[];
  state: ColorState;
  onChange: (s: ColorState) => void;
}) {
  const uniqueId = useId();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [hexInput, setHexInput] = useState(state.customHex ?? "#000000");

  const standard = values.filter((v) => !isMirrorColor(v));
  const mirror = values.filter((v) => isMirrorColor(v));
  const isCustom = state.selected === CUSTOM_COLOR_VALUE;
  const matAllowed = isCustom || isMatAllowed(state.selected);

  const filterId = `mini-blur-${uniqueId.replace(/:/g, "")}`;
  const clipId = `mini-clip-${uniqueId.replace(/:/g, "")}`;

  const renderSwatch = (value: string) => {
    const isSelected = state.selected === value;
    const hex = COLOR_MAP[value.toLowerCase()] ?? "#ccc";
    const isTransparent = value.toLowerCase() === "bezbarwny" || value.toLowerCase() === "przezroczysty";
    const isMilky = value.toLowerCase() === "mleczny";

    return (
      <button
        key={value}
        type="button"
        onClick={() => {
          const next = { ...state, selected: value };
          if (!isMatAllowed(value)) next.matFinish = false;
          onChange(next);
        }}
        className={`relative h-8 w-8 rounded-full border-2 transition-all overflow-hidden ${
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
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-brand-600">{label}</p>

      {standard.length > 0 && (
        <div className="flex flex-wrap gap-1.5">{standard.map(renderSwatch)}</div>
      )}
      {mirror.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-brand-400">Lustrzane</p>
          <div className="flex flex-wrap gap-1.5">{mirror.map(renderSwatch)}</div>
        </div>
      )}

      {/* Custom color */}
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

      {/* Mat toggle */}
      <button
        type="button"
        onClick={() => matAllowed && onChange({ ...state, matFinish: !state.matFinish })}
        disabled={!matAllowed}
        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors ${
          !matAllowed
            ? "cursor-not-allowed border-brand-100 bg-brand-50 text-brand-300"
            : state.matFinish
              ? "border-accent bg-accent/10 font-medium text-accent-dark"
              : "border-brand-200 text-brand-700 hover:border-brand-400"
        }`}
        aria-pressed={state.matFinish}
      >
        <span className={`inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${state.matFinish && matAllowed ? "bg-accent" : "bg-brand-200"}`}>
          <span className={`h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform ${state.matFinish && matAllowed ? "translate-x-3" : "translate-x-0.5"}`} />
        </span>
        Mat
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
  href,
}: MiniConfiguratorModalProps) {
  const { addItemWithTracking } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [customText, setCustomText] = useState("");

  const colorOptionEntries = Object.entries(options).filter(([key]) => isColorOption(key));

  const initialColors: Record<string, ColorState> = {};
  for (const [key, values] of colorOptionEntries) {
    initialColors[key] = { selected: values[0] ?? "", customHex: null, matFinish: false };
  }

  const [colorStates, setColorStates] = useState<Record<string, ColorState>>(initialColors);

  const updateColor = useCallback((optionTitle: string, state: ColorState) => {
    setColorStates((prev) => ({ ...prev, [optionTitle]: state }));
  }, []);

  const buildMetadata = useCallback(() => {
    const meta: Record<string, string> = {};
    for (const [optKey, cs] of Object.entries(colorStates)) {
      const key = optKey.toLowerCase().replace(/^kolor\s*/, "").replace(/\s+/g, "_") || "kolor";
      if (cs.selected === CUSTOM_COLOR_VALUE && cs.customHex) {
        meta[`color_${key}_custom`] = cs.customHex;
      }
      if (cs.matFinish) {
        meta[`color_${key}_mat`] = "true";
      }
    }
    if (customText.trim()) {
      meta.custom_text = customText.trim();
    }
    return meta;
  }, [colorStates, customText]);

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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-brand-100 px-5 py-4">
          {thumbnail && (
            <img
              src={thumbnail}
              alt={title}
              className="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-brand-800 line-clamp-2">{title}</h3>
            <p className="mt-0.5 text-sm font-medium text-accent">
              {(price / 100).toLocaleString("pl-PL", { style: "currency", currency: "PLN" })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-brand-400 transition-colors hover:bg-brand-100 hover:text-brand-600"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          {colorOptionEntries.map(([optionTitle, values]) => (
            <ColorPicker
              key={optionTitle}
              label={optionTitle}
              values={values}
              state={colorStates[optionTitle] ?? { selected: values[0] ?? "", customHex: null, matFinish: false }}
              onChange={(s) => updateColor(optionTitle, s)}
            />
          ))}

          {/* Custom text */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-600">
              Twój tekst <span className="font-normal text-brand-400">(opcjonalnie)</span>
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Wpisz treść, np. nazwę salonu, imię…"
              rows={2}
              maxLength={200}
              className="w-full resize-none rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-brand-100 px-5 py-4">
          <button
            type="button"
            onClick={handleAdd}
            disabled={isAdding}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {isAdding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              "Dodaj do koszyka"
            )}
          </button>
          {href && (
            <Link
              href={href}
              className="mt-2 block w-full text-center text-xs text-brand-400 hover:text-brand-600 transition-colors"
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
