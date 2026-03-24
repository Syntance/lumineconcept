import Link from "next/link";

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
            backgroundPosition: "center",
          }}
        />

        {/* ── Przyciemnienie całego zdjęcia (30% czerni) ── */}
        <div className="absolute inset-0 bg-black/30" />

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
            height: "calc(68% + 80px)",
            backgroundColor: "rgba(24, 18, 16, 0.28)",
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
            <h1 className="font-display text-4xl text-white tracking-widest sm:text-5xl lg:text-6xl">
              CONCEPT
            </h1>

            <p className="mt-3 font-serif text-[1.175rem] uppercase tracking-[0.15em] text-white leading-tight sm:text-[1.4rem] lg:text-[1.7rem]">
              Twój salon zasługuje
              <br />
              na zapamiętywalny branding
            </p>

            <p className="mt-2 text-sm text-white/70 tracking-wide">
              Logo 3D, cenniki i oznaczenia z plexi
            </p>

            <div className="mt-6 flex flex-col items-start gap-3">
              <Link
                href="/produkty"
                className="inline-flex items-center justify-center border border-white/80 px-8 py-3 font-serif text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-brand-900 sm:text-xs"
              >
                Zobacz produkty
              </Link>
              <Link
                href="/produkty/logo-3d"
                className="text-[11px] uppercase tracking-[0.18em] text-white/70 hover:text-white transition-colors"
              >
                Logo 3D na zamówienie &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
