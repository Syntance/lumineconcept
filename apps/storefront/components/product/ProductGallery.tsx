"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinary/utils";
import { CloudinaryImage } from "../common/CloudinaryImage";

/**
 * Zamiast JSowego `useGalleryMaxWidth` (listener resize + 2 reflowy),
 * używamy `clamp()` i CSS custom propertów. Kwadrat tła + maxWidth są
 * liczone przez przeglądarkę natywnie, bez re-renderu Reacta.
 *
 * 10/11 to proporcja slidera; `1.1` odpowiada poprzedniej heurystyce
 * „10% większy niż czysta kalkulacja wysokość-viewport × 10/11".
 */
const GALLERY_MAX_WIDTH_DESKTOP =
  "calc((100dvh - 200px) * (10 / 11) * 1.1)";

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
      <div className="aspect-square bg-brand-100 flex items-center justify-center">
        <span className="text-brand-300">Brak zdjęć</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0]!;

  return (
    <div className="relative isolate w-full overflow-visible">
      {/* Desktop: miniatury + zdjęcie + kwadrat tła — maxWidth ogranicza, ml-auto przykleja do prawej */}
      <div
        className="relative ml-auto flex flex-col gap-3 lg:flex-row-reverse lg:items-start lg:gap-4 lg:[max-width:var(--gallery-max-w)]"
        style={
          {
            ["--gallery-max-w" as string]: GALLERY_MAX_WIDTH_DESKTOP,
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
              className={`relative mx-auto aspect-10/11 w-full overflow-hidden lg:mx-0 lg:!max-h-none ${
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
            className="flex justify-center gap-2 overflow-x-auto pb-1 pt-1 lg:w-21 lg:shrink-0 lg:flex-col lg:justify-start lg:gap-2 lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pt-0 lg:max-h-[min(87vh,calc(100vh-10rem))]"
            role="tablist"
            aria-label="Galeria produktu"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goTo(index)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden border transition-colors lg:h-18 lg:w-18 ${
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
                  width={72}
                  height={72}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
