"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { hexToHsl, hslToHex, isValidHex, normalizeHex } from "@/lib/color/hex";

const PRESET_COLORS = [
  "#000000",
  "#1c1c1c",
  "#4a4a4a",
  "#767676",
  "#b3b3b3",
  "#e8e4e0",
  "#ffffff",
  "#5c2e0f",
  "#8b4513",
  "#c45c26",
  "#d4a017",
  "#c0392b",
  "#8b0000",
  "#6b2737",
  "#0d1b2a",
  "#1b3a5c",
  "#1e6091",
  "#2d6a4f",
  "#40916c",
  "#4a148c",
  "#1a237e",
];

interface CustomHexColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  size?: "sm" | "md";
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function CustomHexColorPicker({
  value,
  onChange,
  size = "md",
  className,
}: CustomHexColorPickerProps) {
  const isSm = size === "sm";
  const fieldId = useId();
  const slRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const dragTarget = useRef<"sl" | "hue" | null>(null);

  const safeValue = isValidHex(value) ? value.toLowerCase() : "#000000";
  const [hexInput, setHexInput] = useState(safeValue);
  const [hsl, setHsl] = useState(() => hexToHsl(safeValue));

  useEffect(() => {
    const next = isValidHex(value) ? value.toLowerCase() : "#000000";
    setHexInput(next);
    setHsl(hexToHsl(next));
  }, [value]);

  const emitHex = useCallback(
    (hex: string) => {
      const normalized = normalizeHex(hex);
      if (!normalized) return;
      onChange(normalized);
      setHexInput(normalized);
      setHsl(hexToHsl(normalized));
    },
    [onChange],
  );

  const updateFromHsl = useCallback(
    (nextH: number, nextS: number, nextL: number) => {
      const hex = hslToHex(nextH, nextS, nextL);
      onChange(hex);
      setHexInput(hex);
      setHsl({ h: nextH, s: nextS, l: nextL });
    },
    [onChange],
  );

  const pickFromSl = useCallback(
    (clientX: number, clientY: number) => {
      const rect = slRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      updateFromHsl(hsl.h, x * 100, (1 - y) * 100);
    },
    [hsl.h, updateFromHsl],
  );

  const pickFromHue = useCallback(
    (clientX: number) => {
      const rect = hueRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      updateFromHsl(x * 360, hsl.s, hsl.l);
    },
    [hsl.l, hsl.s, updateFromHsl],
  );

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (dragTarget.current === "sl") pickFromSl(event.clientX, event.clientY);
      if (dragTarget.current === "hue") pickFromHue(event.clientX);
    };
    const onUp = () => {
      dragTarget.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pickFromHue, pickFromSl]);

  const swatchSize = isSm ? "size-5" : "size-6";
  const slHeight = isSm ? "h-[4.5rem]" : "h-24";

  return (
    <div
      className={cn(
        "space-y-3 border-t border-brand-200/70 pt-3",
        isSm && "space-y-2.5 pt-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "shrink-0 rounded-full border border-brand-200/90 ring-1 ring-inset ring-black/[0.04]",
            isSm ? "size-8" : "size-9",
          )}
          style={{ backgroundColor: safeValue }}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <label htmlFor={fieldId} className="sr-only">
            Kod koloru HEX
          </label>
          <input
            id={fieldId}
            type="text"
            value={hexInput}
            onChange={(e) => {
              const next = e.target.value;
              setHexInput(next);
              const normalized = normalizeHex(next);
              if (normalized) emitHex(normalized);
            }}
            placeholder="#000000"
            spellCheck={false}
            autoComplete="off"
            maxLength={7}
            className={cn(
              "min-w-0 flex-1 border-0 border-b border-brand-200 bg-transparent px-0 py-0.5 font-mono text-brand-800 focus:border-accent focus:outline-none",
              isSm ? "text-xs" : "text-sm",
            )}
          />
          <span className={cn("shrink-0 text-brand-400", isSm ? "text-[9px]" : "text-[10px]")}>
            HEX
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => {
          const selected = safeValue === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => emitHex(color)}
              className={cn(
                "cursor-pointer rounded-full border shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] motion-reduce:transition-none",
                swatchSize,
                selected
                  ? "scale-105 border-accent ring-2 ring-accent ring-offset-1 ring-offset-white"
                  : "border-brand-200/80 hover:border-brand-300",
              )}
              style={{ backgroundColor: color }}
              aria-label={`Kolor ${color}`}
              aria-pressed={selected}
            />
          );
        })}
      </div>

      <div className="space-y-1.5">
        <div
          ref={slRef}
          className={cn(
            "relative w-full cursor-crosshair touch-none overflow-hidden rounded-md border border-brand-200/80",
            slHeight,
          )}
          style={{
            background: `
              linear-gradient(to top, #000, transparent),
              linear-gradient(to right, #fff, hsl(${hsl.h} 100% 50%))
            `,
          }}
          onPointerDown={(event) => {
            dragTarget.current = "sl";
            event.currentTarget.setPointerCapture(event.pointerId);
            pickFromSl(event.clientX, event.clientY);
          }}
          role="slider"
          aria-label="Nasycenie i jasność"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsl.s)}
        >
          <span
            className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ring-1 ring-accent/40"
            style={{
              left: `${hsl.s}%`,
              top: `${100 - hsl.l}%`,
            }}
            aria-hidden
          />
        </div>

        <div
          ref={hueRef}
          className="relative h-2 w-full cursor-pointer touch-none overflow-hidden rounded-full border border-brand-200/80"
          style={{
            background:
              "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
          }}
          onPointerDown={(event) => {
            dragTarget.current = "hue";
            event.currentTarget.setPointerCapture(event.pointerId);
            pickFromHue(event.clientX);
          }}
          role="slider"
          aria-label="Odcień"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsl.h)}
        >
          <span
            className="pointer-events-none absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm ring-1 ring-accent/50"
            style={{ left: `${(hsl.h / 360) * 100}%` }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
