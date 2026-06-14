"use client";

import { useState } from "react";
import Image from "next/image";
import type { GalleryPhoto } from "@/lib/content/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";

const PAGE_SIZE = 6;

type Props = {
  items: GalleryPhoto[];
};

function RealizationTile({ item }: { item: GalleryPhoto }) {
  const alt = item.alt?.trim() || "Realizacja tablicy z logo — Lumine Concept";

  return (
    <div className="relative aspect-square min-w-0 overflow-hidden bg-brand-100 ring-1 ring-brand-200/80">
      <Image
        src={item.imageUrl}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover object-center"
        unoptimized={isCmsImageUnoptimized(item.imageUrl)}
      />
    </div>
  );
}

export function LogoBoardRealizations({ items }: Props) {
  const [visible, setVisible] = useState(() =>
    Math.min(PAGE_SIZE, items.length),
  );

  if (items.length === 0) return null;

  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  return (
    <section className="bg-brand-50 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
          Realizacje
        </h2>
        <div className="mt-3 mx-auto h-px w-12 bg-accent" />
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-8">
          {shown.map((item) => (
            <RealizationTile key={item.id} item={item} />
          ))}
        </div>
        {hasMore ? (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setVisible((v) => Math.min(v + PAGE_SIZE, items.length))}
              className="text-sm font-medium uppercase tracking-[0.2em] text-brand-500 transition-colors hover:text-brand-900"
            >
              Pokaż więcej realizacji
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
