import Image from "next/image";
import { Instagram } from "lucide-react";
import { sanityClient } from "@/lib/sanity/client";
import { SALON_LOGOS_QUERY } from "@/lib/sanity/queries";
import type { SalonLogo } from "@/lib/sanity/types";

type SalonEntry =
  | { type: "text"; name: string }
  | { type: "logo"; name: string; src: string };

const FALLBACK_SALONS: SalonEntry[] = [
  { type: "logo", name: "Sabrija Store", src: "/images/logos/sabrija-store.png" },
  { type: "text", name: "Salon Mia" },
  { type: "text", name: "Beauty Lab" },
  { type: "text", name: "Klinika Urody" },
  { type: "text", name: "Studio Lashes" },
  { type: "text", name: "Hair Concept" },
  { type: "text", name: "Nail Room" },
  { type: "text", name: "Brow Bar" },
  { type: "text", name: "Skin Studio" },
  { type: "text", name: "Beauty Point" },
  { type: "text", name: "Glow Up" },
  { type: "text", name: "Lash Queen" },
  { type: "text", name: "Style Zone" },
];

function mapSanityToEntries(logos: SalonLogo[]): SalonEntry[] {
  return logos.map((logo) =>
    logo.logo?.asset?.url
      ? { type: "logo" as const, name: logo.name, src: logo.logo.asset.url }
      : { type: "text" as const, name: logo.name },
  );
}

export async function HomeTrustMarquee() {
  let salons: SalonEntry[] = FALLBACK_SALONS;

  try {
    const sanityLogos = await sanityClient.fetch<SalonLogo[]>(SALON_LOGOS_QUERY, {}, { next: { revalidate: 60 } });
    if (sanityLogos && sanityLogos.length > 0) {
      salons = mapSanityToEntries(sanityLogos);
    }
  } catch (err) {
    console.error("[HomeTrustMarquee] Nie udało się pobrać logotypów z Sanity:", err);
  }

  const doubled = [...salons, ...salons];

  return (
    <div className="bg-brand-50 pt-4 pb-4 overflow-hidden md:pt-5 md:pb-4">
      <p className="text-center text-sm font-medium uppercase tracking-[0.25em] text-brand-400 mb-4">
        Zaufały nam
      </p>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-brand-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-brand-50 to-transparent z-10" />

        <div className="trust-scroll">
          {doubled.map((salon, i) => (
            <div
              key={`${salon.name}-${i}`}
              className="mx-8 flex h-11 items-center opacity-40 hover:opacity-80 transition-opacity duration-300"
            >
              {salon.type === "logo" ? (
                <Image
                  src={salon.src}
                  alt={salon.name}
                  width={133}
                  height={43}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-base font-medium uppercase tracking-[0.15em] text-brand-600 whitespace-nowrap">
                  {salon.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-sm text-brand-400">
        <Instagram className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
        <span className="font-medium text-brand-600">25 000+ obserwujących</span>
        <span className="mx-1.5 text-brand-300">&middot;</span>
        <span className="text-brand-600">6 000+ realizacji</span>
      </p>
    </div>
  );
}
