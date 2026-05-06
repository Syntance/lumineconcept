"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinary/utils";
import { CloudinaryImage } from "../common/CloudinaryImage";

import { PRODUCT_IMAGE_ASPECT_CLASS } from "@/lib/products/product-image-aspect";

/**
 * Wymiary galerii liczone w CSS, przez customy (zero JS reflowów):
 *
 * --main-h     wysokość głównego zdjęcia. Cap: nie większa niż dostępny
 *              viewport po odjęciu sticky-top (header 4rem + gap 1.5rem)
 *              i odrobiny rezerwy. Dolny clamp 24rem.
 * --main-w     = main-h * 3/4 (proporcja portretowa 3:4 jak Photoshop).
 * --main-left  pozioma odległość od lewej krawędzi viewportu do lewej
 *              krawędzi głównego zdjęcia (= 50vw − main-w), bo prawa
 *              krawędź zdjęcia musi siedzieć dokładnie na środku strony.
 * --thumb-w    szerokość miniatury: preferowana to main-h/5 * 3/4 (czyli
 *              każda miniatura jest dokładnie 1/5 wysokości głównego),
 *              ograniczona przez (main-left − 1rem) — gdy strona robi
 *              się wąska, miniatury kurczą się tak, by zachować 1rem
 *              odstępu od lewej krawędzi viewportu.
 *
 * Aspect 3:4 dla miniatur trzymamy przez `aspect-[3/4]` na <button>,
 * więc wysokość liczy się sama z `--thumb-w`.
 */
const GALLERY_VARS = {
  ["--main-h" as string]: "clamp(24rem, calc((100dvh - 5.5rem) * 0.95), 56rem)",
  ["--main-w" as string]: "calc(var(--main-h) * 3 / 4)",
  ["--main-left" as string]: "calc(50vw - var(--main-w))",
  ["--thumb-max-w" as string]: "max(0px, calc(var(--main-left) - 1rem))",
  ["--thumb-w" as string]:
    "min(calc(var(--main-h) / 5 * 3 / 4), var(--thumb-max-w))",
} as React.CSSProperties;

function GalleryMainImage({
  url,
  alt,
  priority,
}: {
  url: string;
  alt: string;
  priority: boolean;
}) {
  const isExternal = url.startsWith("http");
  const isLocal = isExternal && new URL(url).hostname === "localhost";

  if (isExternal) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, (max-width: 1920px) 50vw, 1120px"
        unoptimized={isLocal}
      />
    );
  }

  return (
    <Image
      loader={cloudinaryLoader}
      src={url}
      alt={alt}
      fill
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className="object-cover object-center"
      sizes="(max-width: 1024px) 100vw, (max-width: 1920px) 50vw, 1120px"
    />
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

  return (
    <div
      className="relative isolate w-full overflow-visible"
      style={GALLERY_VARS}
    >
      {/* Mobile: kolumna (główne nad miniaturami). Desktop: rząd, justify-end —
         para (miniatury, główne) jest dosunięta do prawej krawędzi flex containera.
         lg:-mr-5 (= 1.25rem = połowa lg:gap-10 z gridu PDP) wypycha tę krawędź
         o 1.25rem poza kolumnę galerii — dzięki temu prawa krawędź głównego
         siedzi dokładnie na 50vw (środek strony). */}
      <div className="relative flex flex-col gap-3 lg:-mr-5 lg:flex-row lg:items-start lg:justify-end lg:gap-0">
        {/* Miniatury — order-2 mobile (poziomy pasek pod zdjęciem), order-1 desktop (kolumna po lewej, przyklejona do głównego) */}
        {multiImage && (
          <div
            className="order-2 flex justify-center gap-2 overflow-x-auto pb-1 pt-1 lg:order-1 lg:flex-col lg:justify-start lg:gap-2 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pt-0 lg:[max-height:var(--main-h)]"
            role="tablist"
            aria-label="Galeria produktu"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goTo(index)}
                className={`relative aspect-[3/4] h-[4.25rem] w-[3.25rem] shrink-0 overflow-hidden border transition-colors lg:h-auto lg:w-[var(--thumb-w)] ${
                  index === selectedIndex
                    ? "border-brand-400"
                    : "border-transparent hover:border-brand-200"
                }`}
                role="tab"
                aria-selected={index === selectedIndex}
                aria-label={`Zdjęcie ${index + 1} z ${images.length}`}
              >
                <CloudinaryImage
                  publicId={image.url}
                  alt={image.alt || `${productTitle} - zdjęcie ${index + 1}`}
                  width={144}
                  height={192}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Główne zdjęcie + kwadrat tła */}
        <div className="relative order-1 w-full min-w-0 lg:order-2 lg:w-[var(--main-w)] lg:shrink-0 lg:[height:var(--main-h)]">
          {/* Kwadrat tła — tylko desktop, lekko wystaje poza obrazek (5% w prawo i w dół) */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-[5%] left-[5%] -right-[5%] top-[25%] -z-10 hidden bg-brand-100 lg:block"
          />
          <div
            ref={mainRef}
            className={`relative ${PRODUCT_IMAGE_ASPECT_CLASS} w-full overflow-hidden lg:!aspect-auto lg:h-full lg:w-full ${
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
              className="relative h-full w-full transition-transform duration-200"
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
            <Image
              src="/images/watermark.png"
              alt=""
              aria-hidden="true"
              width={128}
              height={128}
              unoptimized
              className="pointer-events-none absolute right-4 -top-0.5 h-32 w-auto select-none opacity-100"
              style={{ filter: "brightness(0) invert(1)" }}
              draggable={false}
            />
            {multiImage && (
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
    </div>
  );
}
