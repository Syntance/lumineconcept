"use client";

import Link from "next/link";

const GALLERY_ITEMS = [
  { id: 1, label: "Logo 3D z matowym UV", price: "od 149 zł" },
  { id: 2, label: "Tablica cennikowa", price: "od 89 zł" },
  { id: 3, label: "Logo LED z pilotem", price: "od 299 zł" },
  { id: 4, label: "Organizer na kosmetyki", price: "od 69 zł" },
  { id: 5, label: "Tabliczka na drzwi", price: "od 39 zł" },
  { id: 6, label: "Stojak na wizytówki", price: "od 49 zł" },
];

export function MiniGallery() {
  return (
    <section className="py-16 lg:py-24 bg-brand-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl tracking-[0.1em] text-brand-900 lg:text-4xl">
            BESTSELLERY
          </h2>
          <div className="mt-3 mx-auto h-[1px] w-12 bg-accent" />
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x snap-mandatory lg:justify-center">
        {GALLERY_ITEMS.map((item) => (
          <Link
            key={item.id}
            href="/produkty"
            className="shrink-0 snap-start group w-52"
          >
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-brand-100 shadow-sm group-hover:shadow-md transition-shadow duration-300">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-brand-200/60" />
              </div>
              <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/10 transition-colors duration-300" />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs font-medium text-brand-700 group-hover:text-brand-900 transition-colors">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-accent-dark font-medium">
                {item.price}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/produkty"
          className="inline-flex items-center border border-brand-300 px-6 py-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-brand-700 transition-colors hover:border-brand-900 hover:text-brand-900"
        >
          Zobacz wszystkie
        </Link>
      </div>
    </section>
  );
}
