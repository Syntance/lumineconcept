"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    <div className="ring-1 ring-brand-200/80">
      <div className="relative aspect-4/3 overflow-hidden bg-brand-100">
        <Image
          src={item.image.asset.url}
          alt={alt}
          width={w}
          height={h}
          sizes="(max-width: 1024px) 50vw, 25vw"
          className="h-full w-full object-cover"
          placeholder={item.image.asset.metadata?.lqip ? "blur" : "empty"}
          blurDataURL={item.image.asset.metadata?.lqip}
        />
      </div>
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
            Galeria jest w przygotowaniu. Pełne realizacje znajdziesz na stronie
            realizacji.
          </p>
          <Link
            href="/realizacje#tablica-z-logo"
            className="mt-8 inline-flex items-center justify-center border border-brand-300 px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-800 transition-colors hover:bg-brand-50"
          >
            Przejdź do realizacji &rarr;
          </Link>
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
          <p className="mx-auto mt-6 max-w-2xl text-base text-brand-700">
            Jak tablice z logo prezentują się w salonach beauty, gabinetach i
            punktach usługowych — od minimalistycznych logotypów po ozdobne
            tablice z LED.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
          <Link
            href="/realizacje#tablica-z-logo"
            className="text-sm font-medium uppercase tracking-[0.14em] text-brand-600 underline-offset-4 hover:text-brand-900 hover:underline"
          >
            Wszystkie realizacje na osobnej stronie &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
