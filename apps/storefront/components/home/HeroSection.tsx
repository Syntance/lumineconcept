import Link from "next/link";
import { Star } from "lucide-react";

/* ── Nazwy salonów do paska „Zaufały nam" ── */
const SALON_LOGOS = [
  "Salon Mia", "Beauty Lab", "Klinika Urody", "Studio Lashes",
  "Hair Concept", "Nail Room", "Brow Bar", "Skin Studio",
  "Beauty Point", "Glow Up", "Lash Queen", "Style Zone",
];

export function HeroSection() {
  return (
    <>
      {/* ╔══════════════════════════════════════════╗
          ║              HERO SECTION                ║
          ║  Wysokość: 70vh, zdjęcie w tle,          ║
          ║  przyciemnienie, łukowy cień,            ║
          ║  tekst w dolnej-lewej części             ║
          ╚══════════════════════════════════════════╝ */}
      <section className="relative h-[70vh] min-h-[400px] overflow-hidden">

        {/* ── Zdjęcie w tle ── */}
        <div
          className="absolute inset-0 bg-brand-300"
          style={{
            backgroundImage: "url('/images/hero.png')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />

        {/* ── Przyciemnienie całego zdjęcia (30% czerni) ── */}
        <div className="absolute inset-0 bg-black/40" />

        {/* ── Łukowy cień (arch shadow) ──
            Prostokąt z zaokrąglonym dołem, zaczyna się od góry sekcji.
            - left/width: pozycja i szerokość łuku
            - height: jak daleko w dół sięga
            - borderRadius: zagięcie na dole (prosto u góry, łuk u dołu)
            - backgroundColor: kolor i przezroczystość cienia */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 z-[5]"
          style={{
            left: "calc(5% + 60px)",
            width: "min(350px, 35%)",
            height: "calc(68% + 60px)",
            backgroundColor: "rgba(24, 18, 16, 0.5)",
            borderRadius: "0 0 50% 50% / 0 0 30% 30%",
          }}
        />

        {/* ── Blok z tekstem (dolna-lewa część hero) ──
            paddingLeft: wycentrowany na środku łuku
            paddingBottom: odległość od dołu sekcji */}
        <div className="absolute inset-0 z-10 flex items-end">
          <div
            className="pr-6"
            style={{
              paddingLeft: "calc(5% + min(380px, 50%) / 2 - 65px)",
              paddingBottom: "calc(4rem + 140px)",
            }}
          >
            {/* ── Nagłówek „CONCEPT" ── */}
            <h1 className="font-display text-4xl text-white tracking-[0.08em] sm:text-5xl lg:text-6xl">
              CONCEPT
            </h1>

            {/* ── Podtytuł ── */}
            <p className="mt-3 font-serif text-[1.175rem] uppercase tracking-[0.15em] text-white/80 leading-tight sm:text-[1.4rem] lg:text-[1.7rem]">
              Twój salon zasługuje
              <br />
              na zapamiętywany branding
            </p>

            {/* ── Podpis ── */}
            <p className="mt-4 font-serif text-sm tracking-[0.1em] text-white/80 sm:text-base">
              Logo 3D, cenniki i oznaczenia z plexi
            </p>

            {/* ── Przycisk CTA ── */}
            <div className="mt-7">
              <Link
                href="/produkty"
                className="inline-flex items-center justify-center rounded border border-white/70 px-8 py-3 font-serif text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-brand-900 sm:text-xs"
              >
                Zobacz produkty
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ╔══════════════════════════════════════════╗
          ║          PASEK „ZAUFALI NAM"             ║
          ║  Scrollujące nazwy salonów + ocena       ║
          ╚══════════════════════════════════════════╝ */}
      <div className="bg-brand-50 py-7 overflow-hidden">

        {/* ── Nagłówek paska ── */}
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.25em] text-brand-400 mb-5">
          Zaufali nam
        </p>

        {/* ── Scrollujące logo/nazwy salonów ── */}
        <div className="relative">
          {/* Gradienty zanikające po bokach */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-brand-50 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-brand-50 to-transparent z-10" />

          <div className="trust-scroll">
            {[...SALON_LOGOS, ...SALON_LOGOS].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="mx-8 flex h-8 items-center opacity-40 hover:opacity-80 transition-opacity duration-300"
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-brand-600 whitespace-nowrap">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ocena Google ── */}
        <p className="mt-5 text-center text-xs text-brand-400 flex items-center justify-center gap-1.5">
          <Star className="h-3 w-3 fill-accent text-accent" />
          <span className="font-medium text-brand-600">4.9</span>
          na Google
          <span className="mx-1 text-brand-300">&middot;</span>
          430+ opinii
        </p>
      </div>
    </>
  );
}
