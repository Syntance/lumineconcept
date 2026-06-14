"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

import {
  PRODUCT_GALLERY_MAX_WIDTH_STYLE,
  PRODUCT_IMAGE_ASPECT_CLASS,
} from "@/lib/products/product-image-aspect";

/**
 * Zamiast JSowego `useGalleryMaxWidth` (listener resize + 2 reflowy),
 * używamy `clamp()` i CSS custom propertów. Kwadrat tła + maxWidth są
 * liczone przez przeglądarkę natywnie, bez re-renderu Reacta.
 *
 * Proporcja 3:4 — jak zdjęcia produktowe (np. 3024×4032 z Photoshopu).
 */
const GALLERY_MAX_WIDTH_DESKTOP = PRODUCT_GALLERY_MAX_WIDTH_STYLE;
/**
 * Wariant z miniaturkami: cap szerokości tak, żeby
 *   image_col * 1.4 + sticky_top(88px) ≤ 100dvh
 * gdzie image_col = gallery_w − (thumbs_col + gap 1rem). Miniatury skalują się
 * od 4.125rem (lg) do 8.25rem (2xl) — najgorszy przypadek 9.25rem boku.
 *  →  gallery_w ≤ (100dvh − 5.5rem) * 0.71 + 9.25rem (na 2xl)
 * Bezpieczna wartość pośrednia, działa od lg do 2xl.
 */
const GALLERY_MAX_WIDTH_MULTI = "calc((100dvh - 5.5rem) * 0.71 + 6rem)";

function medusaImageUnoptimized(src: string): boolean {
  if (!src.startsWith("http")) return false;
  try {
    const h = new URL(src).hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}

function GalleryMainImage({
  url,
  alt,
  priority,
}: {
  url: string;
  alt: string;
  priority: boolean;
}) {
  return (
    <>
      {/* Skeleton tło — zapobiega białemu błyskowi i CLS */}
      <div className="absolute inset-0 bg-brand-50 animate-pulse" aria-hidden />
      <Image
        src={url}
        alt={alt}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? undefined : "lazy"}
        className="relative z-10 object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 50vw"
        unoptimized={medusaImageUnoptimized(url)}
      />
    </>
  );
}

interface ProductGalleryProps {
  images: Array<{
    id: string;
    url: string;
    alt: string;
  }>;
  productTitle: string;
}

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 });
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, images.length - 1));
      setSelectedIndex(clamped);
      setZoomed(false);
    },
    [images.length],
  );

  const handleMainClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) {
      setZoomed(true);
      updatePan(e.nativeEvent);
    } else {
      setZoomed(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomed) updatePan(e.nativeEvent);
  };

  const updatePan = (e: MouseEvent | React.MouseEvent) => {
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPanOrigin({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.time;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && dt < 400) {
      if (dx < 0) goTo(selectedIndex + 1);
      else goTo(selectedIndex - 1);
    }
    touchStartRef.current = null;
  };

  if (images.length === 0) {
    return (
      <div className={`${PRODUCT_IMAGE_ASPECT_CLASS} bg-brand-100 flex items-center justify-center`}>
        <span className="text-brand-300">Brak zdjęć</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0]!;
  const multiImage = images.length > 1;
  const galleryMaxWidth = multiImage
    ? GALLERY_MAX_WIDTH_MULTI
    : GALLERY_MAX_WIDTH_DESKTOP;

  return (
    <div className="relative isolate w-full overflow-visible">
      {/* Desktop: cały blok dosunięty do prawej (do środka strony) przez ml-auto;
         miniatury przylegają do głównego zdjęcia (lg:gap-4). */}
      <div
        className="relative ml-auto flex flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-4 lg:[max-width:var(--gallery-max-w)]"
        style={
          {
            ["--gallery-max-w" as string]: galleryMaxWidth,
          } as React.CSSProperties
        }
      >
        {/* Główne zdjęcie + kwadrat tła */}
        <div className="relative min-w-0 flex-1">
          {/* Na mobile: bez paddingu/kwadrat; na desktop: kwadrat z proporcjonalnym offsetem */}
          <div className="relative w-full lg:pb-[5%] lg:pr-[5%]">
            {/* Kwadrat tła — tylko desktop */}
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-0 right-0 top-[20%] -z-10 hidden bg-brand-100 lg:block"
              style={{ left: "min(0px, calc(-1 * (100vw - 100%)))" }}
            />
            <div
              ref={mainRef}
              className={`relative mx-auto ${PRODUCT_IMAGE_ASPECT_CLASS} w-full overflow-hidden lg:mx-0 lg:!max-h-none ${
                zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              style={{ maxHeight: "calc(100dvh - 14rem)" }}
              onClick={handleMainClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => zoomed && setZoomed(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="relative z-0 h-full w-full transition-transform duration-200"
                style={
                  zoomed
                    ? {
                        transform: "scale(2)",
                        transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`,
                      }
                    : undefined
                }
              >
                <GalleryMainImage
                  url={selectedImage.url}
                  alt={selectedImage.alt || productTitle}
                  priority={selectedIndex === 0}
                />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 right-0 z-20 pt-6 pr-6"
              >
                <Image
                  src="/images/watermark.png"
                  alt=""
                  width={421}
                  height={134}
                  unoptimized
                  loading="eager"
                  sizes="(max-width: 1024px) 1.75rem, 2.25rem"
                  quality={85}
                  className="block h-7 w-auto max-w-none select-none sm:h-8 lg:h-9"
                  style={{
                    filter:
                      "brightness(0) invert(1) drop-shadow(0 1px 2px rgb(0 0 0 / 0.55)) drop-shadow(0 0 1px rgb(0 0 0 / 0.75))",
                  }}
                  draggable={false}
                />
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 lg:hidden">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`block h-1.5 rounded-full transition-all ${
                        i === selectedIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Miniatury — na mobile: poziomy pasek pod zdjęciem, wyśrodkowany; na desktop: kolumna po lewej */}
        {images.length > 1 && (
          <div
            className="flex justify-center gap-2 overflow-x-auto pb-1 pt-1 lg:w-fit lg:shrink-0 lg:flex-col lg:justify-start lg:gap-2.5 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pt-0 lg:max-h-[min(87vh,calc(100vh-10rem))]"
            role="tablist"
            aria-label="Galeria produktu"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goTo(index)}
                /**
                 * Miniatury rosną progresywnie wraz z dostępną szerokością —
                 * lg: 66×88, xl: 88×117, 2xl: 132×176 (czyli +100% względem lg).
                 * Kolumna z miniaturami ma `lg:w-fit`, więc rośnie automatycznie
                 * (zjada wolne miejsce po lewej, gdy galeria jest `ml-auto`).
                 */
                className={`relative h-[4.25rem] w-[3.25rem] shrink-0 overflow-hidden border transition-colors lg:h-[5.5rem] lg:w-[4.125rem] xl:h-[7.25rem] xl:w-[5.5rem] 2xl:h-[11rem] 2xl:w-[8.25rem] ${
                  index === selectedIndex
                    ? "border-brand-400"
                    : "border-transparent hover:border-brand-200"
                }`}
                role="tab"
                aria-selected={index === selectedIndex}
                aria-label={`Zdjęcie ${index + 1} z ${images.length}`}
              >
                <div className="absolute inset-0 bg-brand-50" aria-hidden />
                <Image
                  src={image.url}
                  alt={image.alt || `${productTitle} - zdjęcie ${index + 1}`}
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 1024px) 3.5rem, 8.25rem"
                  className="relative z-10 object-cover"
                  unoptimized={medusaImageUnoptimized(image.url)}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
