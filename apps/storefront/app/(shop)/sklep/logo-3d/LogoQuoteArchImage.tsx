"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

const IMAGE = {
  src: "/images/categories/logo-kategoria-beauty-sisters.png",
  width: 693,
  height: 915,
  alt: "Tablica z logo Beauty Sisters — przykładowa realizacja",
} as const;

/** Górny łuk = półokrąg (głębokość = połowa szerokości). */
function archBorderRadius(width: number, height: number): string {
  if (width <= 0 || height <= 0) {
    return "50% 50% 0 0 / 38% 38% 0 0";
  }

  const ryPct = Math.min(50, (width * 0.5 / height) * 100);
  return `50% 50% 0 0 / ${ryPct}% ${ryPct}% 0 0`;
}

/**
 * Zdjęcie w formularzu wyceny — łuk z border-radius (gładki AA), nie alfa PNG.
 * Wymiary z CSS vars ustawianych w QuoteImageCtaAlign (po hydracji).
 */
export function LogoQuoteArchImage() {
  const ref = useRef<HTMLDivElement>(null);
  const lastSizeRef = useRef({ w: 0, h: 0 });
  const [frameStyle, setFrameStyle] = useState<CSSProperties>(() => ({
    borderRadius: archBorderRadius(IMAGE.width, IMAGE.height),
  }));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const last = lastSizeRef.current;

      if (Math.abs(w - last.w) < 2 && Math.abs(h - last.h) < 2) {
        return;
      }

      lastSizeRef.current = { w, h };
      setFrameStyle({
        borderRadius: archBorderRadius(w, h),
      });
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "logo-quote-arch relative min-h-0 shrink-0 overflow-hidden",
        "lg:h-(--logo3d-image-h,auto) lg:w-(--logo3d-image-w,auto)",
      )}
      style={frameStyle}
    >
      <Image
        src={IMAGE.src}
        alt={IMAGE.alt}
        fill
        sizes="(max-width: 1024px) 90vw, min(50vw, 42rem)"
        quality={92}
        className="object-cover object-bottom"
        draggable={false}
      />
    </div>
  );
}
