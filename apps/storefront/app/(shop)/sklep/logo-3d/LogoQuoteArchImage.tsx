"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

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
 */
export function LogoQuoteArchImage() {
  const ref = useRef<HTMLDivElement>(null);
  const [frameStyle, setFrameStyle] = useState<CSSProperties>(() => ({
    borderRadius: archBorderRadius(IMAGE.width, IMAGE.height),
  }));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      setFrameStyle({
        borderRadius: archBorderRadius(el.clientWidth, el.clientHeight),
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
      className="logo-quote-arch relative mx-auto h-full w-full overflow-hidden max-lg:aspect-[693/915] max-lg:h-auto max-lg:max-h-[min(55svh,915px)] lg:w-[88%]"
      style={frameStyle}
    >
      <Image
        src={IMAGE.src}
        alt={IMAGE.alt}
        fill
        sizes="(max-width: 1024px) 90vw, min(50vw, 42rem)"
        quality={92}
        className="origin-bottom scale-[1.045] object-cover object-bottom"
        draggable={false}
      />
    </div>
  );
}
