import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Hierarchia skalowania:
 *   1. Cień/panel (aspect-ratio + vmin) → wyznacza --panel-w (szerokość panelu).
 *   2. --panel-w → --cta-fs (rozmiar fontu głównego CTA, proporcjonalny do panelu).
 *   3. --cta-fs → rozmiary h1, podtytułu, body, głównego CTA, odstępów.
 *
 * Układ:
 *   - Główny CTA wyśrodkowany w panelu (oś łuku cienia).
 *   - Napisy: lewa krawędź = lewa krawędź obramówki CTA.
 */

const scale = {
  /** Rozmiar fontu CTA jako ułamek szerokości panelu */
  ctaOfPanel: 0.038,

  /** CONCEPT: było 60/14 względem CTA — podniesione ~8% */
  title: 65 / 14,
  subtitle: 27 / 14,
  body: 18 / 14,

  /** Padding CTA w em (skaluje się z --cta-fs) */
  ctaPadX: 2.85,
  ctaPadY: 1.05,

  /** Odstępy jako wielokrotność --cta-fs */
  /**
   * Po poszerzeniu panelu (aspect 1008/970) panel stał się niższy, więc stary
   * padTop 150/14 (~10.7×) wypychał treść pod krawędź cienia. Zostawiamy
   * 3×--cta-fs + 5% — treść wsuwa się w górę, skalując się nadal razem z
   * panelem (--cta-fs dalej zależy od szerokości panelu).
   */
  padTop: 3,
  /** Osobne odstępy: CONCEPT→podtytuł, podtytuł→body, body→CTA */
  gapAfterTitle: 0.55 * 1.5,
  gapAfterSubtitle: 0.9 * 1.5,
  gapBeforeCta: 1.4,
  gapCtaStack: 1.1,
} as const;

export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex min-h-[52vmin] w-full flex-col overflow-x-hidden" style={{ minHeight: "min(92dvh, 96vmin)" }}>
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
      {/* Panel cienia + treści.
          • Szerokość: 54vmin / 100vw-1.5rem / 63rem — o 50% większa niż
            oryginalne 36vmin / 42rem.
          • Wysokość: aspect 1008/1200 daje h = 54vmin × 1200/1008 ≈ 65vmin
            (między obecnymi płaskimi 52vmin a „za wysokimi” 78vmin z wcześn.
            proporcji 672/970). Panel wraca do bardziej wertykalnego kształtu
            łuku, ale nie jest już tak przytłaczający jak przy 1.5× w obu osiach.
          • Wszystkie rozmiary (h1, body, CTA, odstępy) wyliczają się z tej
            samej formuły przez --cta-fs, więc na każdym monitorze trzymają
            spójne proporcje względem panelu (a ten do sekcji bazuje na vmin,
            czyli mniejszym z wymiarów okna). */}
      <div
        className="absolute top-0 flex aspect-[1008/1200] w-[min(54vmin,calc(100vw-1.5rem),63rem)] max-w-[calc(100vw-2rem)] flex-col"
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
              "--cta-fs": `calc(min(54vmin, calc(100vw - 1.5rem), 63rem) * ${scale.ctaOfPanel})`,
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
                className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-none border-0 bg-white font-sans font-medium uppercase tracking-[0.2em] !text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                style={{
                  fontSize: "var(--cta-fs)",
                  lineHeight: 1.15,
                  paddingLeft: `${scale.ctaPadX}em`,
                  paddingRight: `${scale.ctaPadX}em`,
                  paddingTop: `${scale.ctaPadY}em`,
                  paddingBottom: `${scale.ctaPadY}em`,
                  borderRadius: 0,
                }}
              >
                Zobacz produkty
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
