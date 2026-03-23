import Link from "next/link";
import { Instagram } from "lucide-react";


const SALON_LOGOS = [
  "Salon Mia", "Beauty Lab", "Klinika Urody", "Studio Lashes",
  "Hair Concept", "Nail Room", "Brow Bar", "Skin Studio",
  "Beauty Point", "Glow Up", "Lash Queen", "Style Zone",
];

export function HeroSection() {
  return (
    <>
      <section className="relative h-[70vh] min-h-[400px] overflow-hidden">

        {/* Zdjecie w tle */}
        <div
          className="absolute inset-0 bg-brand-300"
          style={{
            backgroundImage: "url('/images/hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "55% 35%",
          }}
        />

        {/* Przyciemnienie + blur */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        {/* Lukowy cien (arch shadow) */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 z-[5] backdrop-blur-[2px]"
          style={{
            left: "calc(5% + 60px)",
            width: "min(350px, 35%)",
            height: "calc(68% + 60px)",
            backgroundColor: "rgba(24, 18, 16, 0.5)",
            borderRadius: "0 0 50% 50% / 0 0 40% 40%",
          }}
        />

        {/* Blok z tekstem */}
        <div className="absolute inset-0 z-10 flex items-end">
          <div
            className="pr-6"
            style={{
              paddingLeft: "calc(5% + min(380px, 50%) / 2 - 65px)",
              paddingBottom: "calc(4rem + 140px)",
            }}
          >
            <h1 className="font-binerka text-4xl text-white tracking-[0.08em] sm:text-5xl lg:text-6xl">
              CONCEPT
            </h1>

            <p className="mt-4 font-sans font-medium text-[1.175rem] uppercase tracking-[0.15em] text-white/80 leading-tight sm:text-[1.4rem] lg:text-[1.7rem]">
              Twój salon zasługuje
              <br />
              na zapamiętywalny branding
            </p>

            <p className="mt-4 font-sans text-sm tracking-[0.1em] text-white/80 sm:text-base">
              Logo 3D, cenniki i oznaczenia z plexi
            </p>

            {/* CTA */}
            <div className="mt-7 inline-flex flex-col items-center">
              <Link
                href="/produkty"
                className="inline-flex items-center justify-center rounded border border-white/70 px-8 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-brand-900 sm:text-xs"
              >
                Zobacz produkty
              </Link>
              <Link
                href="/logo-3d"
                className="mt-4 font-sans text-[11px] tracking-[0.15em] text-white/90 underline underline-offset-4 decoration-white/30 transition-colors hover:text-white hover:decoration-white/60 sm:text-xs"
              >
                Logo 3D na zamówienie &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pasek Zaufały nam */}
      <div className="bg-brand-50 py-7 overflow-hidden">

        <p className="text-center font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-brand-400 mb-5">
          Zaufały nam
        </p>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-brand-50 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-brand-50 to-transparent z-10" />

          <div className="trust-scroll">
            {[...SALON_LOGOS, ...SALON_LOGOS].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="mx-8 flex h-8 items-center opacity-40 hover:opacity-80 transition-opacity duration-300"
              >
                <span className="font-sans text-[10px] font-medium uppercase tracking-[0.15em] text-brand-600 whitespace-nowrap">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 font-sans flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-xs text-brand-400">
          <Instagram className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          <span className="font-medium text-brand-600">25 000+ obserwujących</span>
          <span className="mx-1.5 text-brand-300">&middot;</span>
          <span className="text-brand-600">6 000+ realizacji</span>
        </p>
      </div>
    </>
  );
}
