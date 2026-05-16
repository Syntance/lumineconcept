"use client";

import { useState } from "react";
import Image from "next/image";
import type { RealizationPhoto } from "@/lib/sanity/types";

const PAGE_SIZE = 4;

type Props = {
  items: RealizationPhoto[];
};

function RealizationTile({ item }: { item: RealizationPhoto }) {
  const dim = item.image?.asset?.metadata?.dimensions;
  const w = dim?.width ?? 800;
  const h = dim?.height ?? 600;
  const alt =
    item.image?.alt?.trim() ||
    "Realizacja tablicy z logo — Lumine Concept";

  return (
    <div className="min-w-0 overflow-hidden bg-brand-100 ring-1 ring-brand-200/80">
      <Image
        src={item.image.asset.url}
        alt={alt}
        width={w}
        height={h}
        sizes="(max-width: 1024px) 50vw, 25vw"
        className="h-auto w-full max-w-full object-cover object-center"
        placeholder={item.image.asset.metadata?.lqip ? "blur" : "empty"}
        blurDataURL={item.image.asset.metadata?.lqip}
      />
    </div>
  );
}

export function LogoBoardRealizations({ items }: Props) {
  const [visible, setVisible] = useState(() =>
    Math.min(PAGE_SIZE, items.length),
  );

  if (items.length === 0) {
    return (
      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-display text-2xl uppercase tracking-[0.18em] text-brand-800 lg:text-3xl">
            Zapoznaj się z naszymi realizacjami
          </h2>
          <div className="mx-auto mt-3 h-px w-12 bg-accent" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-brand-700">
            Galeria jest w przygotowaniu — wkrótce dodamy tu zdjęcia realizacji.
          </p>
        </div>
      </section>
    );
  }

  const slice = items.slice(0, visible);
  const canShowMore = visible < items.length;

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="font-display text-2xl uppercase tracking-[0.18em] text-brand-800 lg:text-3xl">
            Zapoznaj się z naszymi realizacjami
          </h2>
          <div className="mx-auto mt-3 h-px w-12 bg-accent" />
        </div>

        <ul className="mt-10 grid grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-4">
          {slice.map((item) => (
            <li key={item._key}>
              <RealizationTile item={item} />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center gap-4">
          {canShowMore ? (
            <button
              type="button"
              onClick={() =>
                setVisible((v) => Math.min(v + PAGE_SIZE, items.length))
              }
              className="inline-flex items-center justify-center border border-brand-300 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-800 transition-colors hover:bg-brand-50"
            >
              Zobacz więcej
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
