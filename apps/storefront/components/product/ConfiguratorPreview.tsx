"use client";

import { useEffect, useRef, useState } from "react";
import { COLOR_MAP } from "./ProductVariantSelector";
import type { ColorRegion } from "./ProductConfigurator";

interface ConfiguratorPreviewProps {
  baseImageUrl: string;
  colorRegions: ColorRegion[];
  selectedColors: Record<string, string>;
}

function resolveHex(colorNameOrHex: string): string | null {
  if (!colorNameOrHex) return null;
  if (colorNameOrHex.startsWith("#")) return colorNameOrHex;
  const mapped = COLOR_MAP[colorNameOrHex.toLowerCase()];
  if (mapped === "transparent") return null;
  return mapped ?? null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function ConfiguratorPreview({
  baseImageUrl,
  colorRegions,
  selectedColors,
}: ConfiguratorPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [masks, setMasks] = useState<Record<string, HTMLImageElement>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    async function load() {
      try {
        const base = await loadImage(baseImageUrl);
        if (cancelled) return;
        setBaseImage(base);

        const maskEntries = await Promise.all(
          colorRegions.map(async (region) => {
            try {
              const img = await loadImage(region.maskUrl);
              return [region.name, img] as const;
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) return;
        const maskMap: Record<string, HTMLImageElement> = {};
        for (const entry of maskEntries) {
          if (entry) maskMap[entry[0]] = entry[1];
        }
        setMasks(maskMap);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [baseImageUrl, colorRegions]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = baseImage.naturalWidth;
    const h = baseImage.naturalHeight;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(baseImage, 0, 0, w, h);

    for (const region of colorRegions) {
      const mask = masks[region.name];
      if (!mask) continue;

      const colorValue = selectedColors[region.name];
      const hex = colorValue ? resolveHex(colorValue) : null;
      if (!hex) continue;

      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) continue;

      offCtx.drawImage(mask, 0, 0, w, h);
      offCtx.globalCompositeOperation = "source-in";
      offCtx.fillStyle = hex;
      offCtx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(offscreen, 0, 0, w, h);
    }

    ctx.globalCompositeOperation = "source-over";
  }, [baseImage, masks, colorRegions, selectedColors]);

  if (error) return null;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-brand-100 bg-brand-50">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-accent" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`h-full w-full object-contain transition-opacity ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      />
      {!loading && colorRegions.length > 0 && (
        <div className="absolute bottom-2 left-2 flex gap-1">
          {colorRegions.map((region) => {
            const colorValue = selectedColors[region.name];
            const hex = colorValue ? resolveHex(colorValue) : null;
            return (
              <span
                key={region.name}
                className="flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-brand-600 backdrop-blur-sm"
              >
                {hex && (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-brand-200"
                    style={{ backgroundColor: hex }}
                  />
                )}
                {region.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
