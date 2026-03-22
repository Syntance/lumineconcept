"use client";

import Link from "next/link";
import { Star } from "lucide-react";

const SEGMENTS = [
  {
    title: "Salony beauty",
    href: "/salony-beauty",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&fit=crop",
  },
  {
    title: "Gotowe wzory",
    href: "/produkty",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop",
  },
  {
    title: "Inna branża",
    href: "/kontakt",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop",
  },
] as const;

const GALLERY_ITEMS = [
  "Logo 3D z matowym UV",
  "Tablica cennikowa",
  "Logo LED z pilotem",
  "Organizer na kosmetyki",
  "Tabliczka na drzwi",
  "Stojak na wizytówki",
];

const SALON_LOGOS = [
  "Salon Mia", "Beauty Lab", "Klinika Urody", "Studio Lashes",
  "Hair Concept", "Nail Room", "Brow Bar", "Skin Studio",
  "Beauty Point", "Glow Up", "Lash Queen", "Style Zone",
];

export function SegmentCards() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section heading */}
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl tracking-[0.1em] text-brand-900 lg:text-4xl">
            Poznaj naszą ofertę
          </h2>
          <div className="mt-3 mx-auto h-[1px] w-12 bg-accent" />
        </div>

        {/* 3 segment cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {SEGMENTS.map((seg) => (
            <Link
              key={seg.title}
              href={seg.href}
              className="group text-center"
            >
              <div className="relative mx-auto w-56 h-56 rounded-[2rem] overflow-hidden bg-brand-100 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${seg.image}')` }}
                />
                <div className="absolute inset-0 bg-brand-900/10 group-hover:bg-brand-900/20 transition-colors duration-300" />
              </div>
              <h3 className="mt-5 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-700 group-hover:text-brand-900 transition-colors">
                {seg.title}
              </h3>
            </Link>
          ))}
        </div>

        {/* Fallback CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/salony-beauty#galeria"
            className="text-[11px] font-medium text-brand-500 hover:text-brand-900 transition-colors tracking-wide"
          >
            Nie wiesz co wybrać? Zobacz nasze realizacje &rarr;
          </Link>
        </div>

        {/* Mini-galeria realizacji — BEZ CEN, BEZ KOSZYKA */}
        <div className="mt-14">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory lg:justify-center">
            {GALLERY_ITEMS.map((label, i) => (
              <Link
                key={label}
                href="/salony-beauty#galeria"
                className="shrink-0 snap-start group w-44"
              >
                <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-brand-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-brand-200/60" />
                  </div>
                  <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/10 transition-colors duration-300" />
                </div>
                <p className="mt-2 text-center text-[10px] text-brand-500 group-hover:text-brand-700 transition-colors">
                  {label}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Trust bar repeat */}
        <div className="mt-14 overflow-hidden">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-linear-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-white to-transparent z-10" />
            <div className="trust-scroll">
              {[...SALON_LOGOS, ...SALON_LOGOS].map((name, i) => (
                <div
                  key={`trust2-${name}-${i}`}
                  className="mx-8 flex h-8 items-center opacity-30 hover:opacity-70 transition-opacity duration-300"
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-brand-500 whitespace-nowrap">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-brand-400 flex items-center justify-center gap-1.5">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="font-medium text-brand-600">4.9</span>
            na Google
            <span className="mx-1 text-brand-300">&middot;</span>
            430+ opinii
          </p>
        </div>

        {/* Marka z twarzą */}
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div className="h-14 w-14 rounded-full bg-brand-200 shrink-0" />
          <p className="text-sm text-brand-600 text-center sm:text-left max-w-sm">
            <span className="font-semibold text-brand-800">Za Lumine stoją trzy siostry</span>
            {" "}— od projektu do paczki, każdy produkt przechodzi przez nasze ręce.
          </p>
        </div>
      </div>
    </section>
  );
}
