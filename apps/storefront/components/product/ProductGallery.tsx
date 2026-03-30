"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { cloudinaryLoader } from "@/lib/cloudinary/utils";
import { CloudinaryImage } from "../common/CloudinaryImage";

function GalleryMainImage({ url, alt }: { url: string; alt: string }) {
  const isExternal = url.startsWith("http");
  const isLocal = isExternal && new URL(url).hostname === "localhost";

  if (isExternal) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        priority
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 50vw"
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
      priority
      className="object-cover object-center"
      sizes="(max-width: 1024px) 100vw, 50vw"
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
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = e.changedTouches[0];
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
      <div className="aspect-square rounded-lg bg-brand-50 flex items-center justify-center">
        <span className="text-brand-300">Brak zdjęć</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="flex gap-4">
      {/* Vertical thumbnails — desktop */}
      {images.length > 1 && (
        <div
          className="hidden lg:flex flex-col gap-2 overflow-y-auto max-h-[700px] shrink-0"
          role="tablist"
          aria-label="Galeria produktu"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                index === selectedIndex
                  ? "border-accent"
                  : "border-transparent hover:border-brand-200"
              }`}
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={`Zdjęcie ${index + 1} z ${images.length}`}
            >
              <CloudinaryImage
                publicId={image.url}
                alt={image.alt || `${productTitle} - zdjęcie ${index + 1}`}
                width={80}
                height={80}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3">
        {/* Main image with zoom + swipe */}
        <div
          ref={mainRef}
          className={`relative aspect-[10/11] overflow-hidden rounded-lg bg-brand-50 ${
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
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
            />
          </div>
          {/* Watermark */}
          <img
            src="/images/watermark.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-4 -top-0.5 h-32 w-auto select-none opacity-100"
            style={{ filter: "brightness(0) invert(1)" }}
            draggable={false}
          />
          {/* Dot indicators mobile */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
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

        {/* Horizontal thumbnails — mobile */}
        {images.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
            role="tablist"
            aria-label="Galeria produktu"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => goTo(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  index === selectedIndex
                    ? "border-accent"
                    : "border-transparent hover:border-brand-200"
                }`}
                role="tab"
                aria-selected={index === selectedIndex}
                aria-label={`Zdjęcie ${index + 1} z ${images.length}`}
              >
                <CloudinaryImage
                  publicId={image.url}
                  alt={image.alt || `${productTitle} - zdjęcie ${index + 1}`}
                  width={64}
                  height={64}
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
