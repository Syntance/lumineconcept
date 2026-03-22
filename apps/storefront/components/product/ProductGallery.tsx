"use client";

import { useState } from "react";
import { CloudinaryImage } from "../common/CloudinaryImage";

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

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-brand-50 flex items-center justify-center">
        <span className="text-brand-300">Brak zdjęć</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-50">
        <CloudinaryImage
          publicId={selectedImage.url}
          alt={selectedImage.alt || productTitle}
          width={1200}
          height={1200}
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Galeria produktu">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
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
    </div>
  );
}
