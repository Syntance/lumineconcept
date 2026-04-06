import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-[400px] overflow-hidden">
      {/* Zdjęcie w tle */}
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[55%_35%]"
      />

      {/* Przyciemnienie + subtelny blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Łukowy cień */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 z-5 backdrop-blur-sm"
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
            Wyróżnij swój salon
          </p>

          <p className="mt-4 font-sans text-sm tracking-widest text-white/80 sm:text-base">
            Logo 3D, cenniki i oznaczenia z plexi
          </p>

          <div className="mt-7 inline-flex flex-col items-center">
            <Link
              href="/sklep"
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
  );
}
