import Image from "next/image";
import Link from "next/link";

/** Wymiary pliku `public/images/hero-main-wall.png` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/**
 * Hero z napisami i CTA — rozmiary w `vw`, pozycja w `%`.
 * Nie skaluje się proporcjonalnie do obrazu, tylko do viewportu.
 */
export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      <div className="relative w-full overflow-x-hidden">
        <Image
          src="/images/hero-main-wall.png"
          alt=""
          width={HERO_BG_WIDTH}
          height={HERO_BG_HEIGHT}
          priority
          sizes="100vw"
          unoptimized
          className="block h-auto w-full select-none"
        />

        {/* Lekki gradient od lewej pod biały tekst */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/45 via-black/15 to-transparent"
          aria-hidden
        />

        {/* Treść: pozycja w % od kontenera obrazu, rozmiary w vw */}
        <div
          className="absolute z-10 flex flex-col items-start gap-6"
          style={{
            left: "18%",
            top: "30%",
          }}
        >
          <div className="flex flex-col items-start gap-4">
            <h1
              className="m-0 whitespace-nowrap text-left font-binerka tracking-[0.06em] font-normal text-white"
              style={{
                fontSize: "clamp(32px, 4vw, 72px)",
                lineHeight: 1,
              }}
            >
              CONCEPT
            </h1>

            <div className="flex flex-col items-start gap-2">
              <p
                className="m-0 whitespace-nowrap text-left font-gilroy font-medium uppercase leading-none tracking-[0.08em] text-white"
                style={{
                  fontSize: "clamp(14px, 1.5vw, 24px)",
                }}
              >
                Wyróżnij swój salon
              </p>

              <p
                className="m-0 whitespace-nowrap text-left font-gilroy font-light leading-tight tracking-[0.06em] text-white/90"
                style={{
                  fontSize: "clamp(12px, 1.2vw, 20px)",
                }}
              >
                Tablice z logo, cenniki i oznaczenia z plexi
              </p>
            </div>
          </div>

          {/* Główny CTA */}
          <Link
            href="/sklep"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-0 bg-white px-7 py-3 font-gilroy font-semibold uppercase tracking-[0.2em] text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              fontSize: "clamp(11px, 1vw, 16px)",
              lineHeight: 1.15,
            }}
          >
            Zobacz produkty
          </Link>
        </div>
      </div>

      {/* Karuzela — pod grafiką, bez wymuszania pełnej wysokości viewportu */}
      {children && (
        <div className="relative z-20 w-full shrink-0">{children}</div>
      )}
    </section>
  );
}
