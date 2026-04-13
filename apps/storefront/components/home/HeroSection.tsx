import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Hierarchia skalowania:
 *   1. Cień/panel (aspect-ratio + vmin) → wyznacza --panel-w (szerokość panelu).
 *   2. --panel-w → --cta-fs (rozmiar fontu głównego CTA, proporcjonalny do panelu).
 *   3. --cta-fs → rozmiary h1, podtytułu, body, CTA tekstowego, odstępów.
 *
 * Układ:
 *   - Główny CTA wyśrodkowany w panelu (oś łuku cienia).
 *   - Napisy: lewa krawędź = lewa krawędź obramówki CTA.
 *   - CTA tekstowe: wyśrodkowane pod głównym CTA, nigdy nie wystaje poza jego obramówkę.
 */

const scale = {
  /** Rozmiar fontu CTA jako ułamek szerokości panelu */
  ctaOfPanel: 0.038,

  /** CONCEPT: było 60/14 względem CTA — podniesione ~8% */
  title: 65 / 14,
  subtitle: 27 / 14,
  body: 18 / 14,
  ctaSecondary: 0.9,

  /** Padding CTA w em (skaluje się z --cta-fs) */
  ctaPadX: 2.85,
  ctaPadY: 1.05,

  /** Odstępy jako wielokrotność --cta-fs */
  padTop: 150 / 14,
  /** Osobne odstępy: CONCEPT→podtytuł, podtytuł→body, body→CTA */
  gapAfterTitle: 0.55 * 1.5,
  gapAfterSubtitle: 0.9 * 1.5,
  gapBeforeCta: 1.4,
  gapCtaStack: 1.1,
  ctaRadius: 0.38,
  underlineOffset: 0.42,
} as const;

export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex min-h-[52vmin] w-full flex-col" style={{ minHeight: "min(92dvh, 96vmin)" }}>
      <Image
        src="/images/hero.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[55%_35%]"
      />

      <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Główna treść hero — rozciąga się, żeby karuzela została na dole */}
      <div className="relative z-10 flex flex-1">
      <div
        className="absolute top-0 flex aspect-[672/970] w-[min(36vmin,calc(100vw-1.5rem),42rem)] max-w-[calc(100vw-2rem)] flex-col"
        style={{
          left: "max(1rem, calc(max(0.75rem, 4.5vmin) + 100px))",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(24, 18, 16, 0.5)",
            borderRadius: "0 0 50% 50% / 0 0 38% 38%",
          }}
        />

        <div
          className="relative z-10 box-border flex min-h-[76%] w-full max-w-none flex-col items-stretch justify-center text-left"
          style={
            {
              "--cta-fs": `calc(min(36vmin, calc(100vw - 1.5rem), 42rem) * ${scale.ctaOfPanel})`,
              paddingTop: `calc(var(--cta-fs) * ${scale.padTop} + 5%)`,
            } as CSSProperties
          }
        >
          {/* CTA wyśrodkowane w panelu — oś łuku cienia */}
          <div className="flex w-full justify-center">
            <div
              className="grid w-max max-w-full grid-cols-1 justify-items-center"
              style={{ rowGap: `calc(var(--cta-fs) * ${scale.gapCtaStack})` }}
            >
              {/* Napisy: width:0 + overflow:visible → nie rozciągają siatki; lewa krawędź = lewa krawędź obramówki CTA */}
              <div
                className="flex flex-col items-start justify-self-start overflow-visible"
                style={{
                  width: 0,
                  minWidth: 0,
                  marginBottom: `calc(var(--cta-fs) * ${scale.gapBeforeCta})`,
                }}
              >
                <h1
                  className="m-0 whitespace-nowrap text-left font-binerka tracking-[0.10em] !font-normal !text-white"
                  style={{
                    fontSize: `calc(var(--cta-fs) * ${scale.title})`,
                    lineHeight: 1,
                    fontWeight: 400,
                  }}
                >
                  CONCEPT
                </h1>

                <p
                  className="m-0 whitespace-nowrap text-left font-sans font-normal uppercase leading-none tracking-[0.18em] !text-white"
                  style={{
                    fontSize: `calc(var(--cta-fs) * ${scale.subtitle})`,
                    fontWeight: 400,
                    marginTop: `calc(var(--cta-fs) * ${scale.gapAfterTitle})`,
                  }}
                >
                  Wyróżnij swój salon
                </p>

                <p
                  className="m-0 whitespace-nowrap text-left font-sans font-light leading-tight tracking-[0.06em] !text-white/90"
                  style={{
                    fontSize: `calc(var(--cta-fs) * ${scale.body})`,
                    fontWeight: 300,
                    marginTop: `calc(var(--cta-fs) * ${scale.gapAfterSubtitle})`,
                  }}
                >
                  Logo 3D, cenniki i oznaczenia z plexi
                </p>
              </div>

              {/* Główny CTA */}
              <Link
                href="/sklep"
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap border border-white/70 bg-transparent font-sans uppercase tracking-[0.2em] !text-white transition-colors hover:bg-white hover:!text-brand-900"
                style={{
                  fontSize: "var(--cta-fs)",
                  lineHeight: 1.15,
                  paddingLeft: `${scale.ctaPadX}em`,
                  paddingRight: `${scale.ctaPadX}em`,
                  paddingTop: `${scale.ctaPadY}em`,
                  paddingBottom: `${scale.ctaPadY}em`,
                  borderRadius: `calc(var(--cta-fs) * ${scale.ctaRadius})`,
                }}
              >
                Zobacz produkty
              </Link>

              {/* CTA tekstowe — max-width = 100% kolumny (= szerokość przycisku), nigdy nie wystaje */}
              <Link
                href="/logo-3d"
                className="max-w-full text-center font-sans leading-tight tracking-[0.14em] !text-white/92 underline decoration-white/35 transition-colors hover:!text-white hover:decoration-white/55"
                style={{
                  fontSize: `calc(var(--cta-fs) * ${scale.ctaSecondary})`,
                  textUnderlineOffset: `calc(var(--cta-fs) * ${scale.underlineOffset})`,
                }}
              >
                Logo 3D na zamówienie&nbsp;&rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Karuzela logo — zawsze na dole hero */}
      {children && (
        <div className="relative z-20 w-full shrink-0">
          {children}
        </div>
      )}
    </section>
  );
}
