import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * Układ „nad foldem”:
 *   1. Sekcja: `100svh − (announcement + header [+ referral])` dzięki `--shop-chrome-h`
 *      na `#main-content` — hero + karuzela mieści się w jednym kadrze pod paskami.
 *   2. Obszar grafiki: `flex-1 min-h-0` — rozciąga się w pionie i poziomie; zdjęcie object-cover.
 *   3. Panel z napisami i CTA = „kanwa projektowa” o stałych proporcjach 1008×1200,
 *      będąca **container query container** (`container-type: inline-size`).
 *      Wszystko wewnątrz (cień, CONCEPT, podtytuł, body, padding, CTA) skaluje się przez
 *      `cqw` względem **rzeczywistej szerokości kanwy** — odporne na zoom przeglądarki,
 *      DPR, kontekst rodzica, max-width / clampy. Zmiana szerokości panelu = zmiana
 *      całej zawartości w identycznych proporcjach.
 *   4. Sama szerokość kanwy zależy od viewportu (`min(vmin, vw, rem)`),
 *      ale to nie wpływa na proporcje WEWNĘTRZNE.
 */

/**
 * Skala panelu względem viewportu (sterowana niezależnie od proporcji wewnętrznych).
 * Bazowe progi 54vmin / 63rem ×  `PANEL_VISUAL_SCALE`.
 */
const PANEL_BASE_VMIN = 54;
const PANEL_BASE_MAX_REM = 63;
const PANEL_VISUAL_SCALE = 0.95;
const panelWMin = PANEL_BASE_VMIN * PANEL_VISUAL_SCALE;
const panelWMaxRem = PANEL_BASE_MAX_REM * PANEL_VISUAL_SCALE;

const scale = {
  /** Rozmiar fontu CTA jako ułamek szerokości panelu */
  ctaOfPanel: 0.038,

  /** CONCEPT: było 60/14 względem CTA — podniesione ~8% */
  title: 65 / 14,
  subtitle: 20 / 14,
  body: 18 / 14,

  /** Padding CTA w em (−10% względem poprzednich wartości). */
  ctaPadX: 1.85,
  ctaPadY: 0.76,

  /** Odstępy jako wielokrotność --cta-fs */
  /**
   * Po poszerzeniu panelu (aspect 1008/970) panel stał się niższy, więc stary
   * padTop 150/14 (~10.7×) wypychał treść pod krawędź cienia. Zostawiamy
   * 3×--cta-fs + 5% — treść wsuwa się w górę, skalując się nadal razem z
   * panelem (--cta-fs dalej zależy od szerokości panelu).
   */
  padTop: 3,
  /** Osobne odstępy: CONCEPT→podtytuł, podtytuł→body (flex `gap`, nie margin — stabilne z m-0) */
  gapAfterTitle: 0.9 * 1.5,
  gapAfterSubtitle: 0.62 * 1.5,
  gapBeforeCta: 1.4,
  gapCtaStack: 1.1,
} as const;

export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex h-[calc(100svh-var(--shop-chrome-h))] min-h-0 w-full flex-col overflow-x-hidden">
      {/* Wysokość = widok minus announcement + sticky header (--shop-chrome-h), żeby hero + karuzela mieściły się „nad foldem”. */}
      {/* Grafika wypełnia elastyczny obszar nad karuzelą — pełna szerokość i dostępna wysokość viewportu. */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_42%]"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        {/* Treść nad obrazem */}
        <div className="absolute inset-0 z-10 flex">
          {/* Kanwa projektowa: stałe proporcje 1008×1200 + container query container.
              Wszystkie dzieci poniżej skalują się przez `cqw` względem rzeczywistej szerokości
              tej kanwy — proporcje wewnętrzne są niezmienne na każdym ekranie/zoomie. */}
          <div
            className="absolute top-0 flex aspect-[1008/1200] flex-col"
            style={{
              containerType: "inline-size",
              containerName: "hero-panel",
              left: "max(1rem, calc(max(0.75rem, 4.5vmin) + 100px))",
              width: `min(${panelWMin}vmin, calc(100vw - 1.5rem), ${panelWMaxRem}rem)`,
              maxWidth: "calc(100vw - 2rem)",
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
                  // `--cta-fs` = ułamek szerokości kanwy (cqw), nie viewportu.
                  // Dzięki temu typografia i CTA skalują się 1:1 z faktycznym wymiarem panelu,
                  // a nie z `min(vmin/vw/rem)` — odporne na clampy i kontekst rodzica.
                  "--cta-fs": `calc(100cqw * ${scale.ctaOfPanel})`,
                  paddingTop: `calc(var(--cta-fs) * ${scale.padTop} + 5cqw)`,
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
                      rowGap: `calc(var(--cta-fs) * ${scale.gapAfterTitle})`,
                    }}
                  >
                    <h1
                      className="m-0 whitespace-nowrap text-left font-binerka tracking-[0.06em] !font-normal !text-white"
                      style={{
                        fontSize: `calc(var(--cta-fs) * ${scale.title})`,
                        lineHeight: 1,
                        fontWeight: 400,
                      }}
                    >
                      CONCEPT
                    </h1>

                    <div
                      className="flex flex-col items-start overflow-visible"
                      style={{
                        rowGap: `calc(var(--cta-fs) * ${scale.gapAfterSubtitle})`,
                      }}
                    >
                      <p
                        className="m-0 whitespace-nowrap text-left font-gilroy font-medium uppercase leading-none tracking-[0.08em] !text-white"
                        style={{
                          fontSize: `calc(var(--cta-fs) * ${scale.subtitle})`,
                          fontWeight: 500,
                        }}
                      >
                        Wyróżnij swój salon
                      </p>

                      <p
                        className="m-0 whitespace-nowrap text-left font-gilroy font-light leading-tight tracking-[0.06em] !text-white/90"
                        style={{
                          fontSize: `calc(var(--cta-fs) * ${scale.body})`,
                          fontWeight: 300,
                        }}
                      >
                        Logo 3D, cenniki i oznaczenia z plexi
                      </p>
                    </div>
                  </div>

                  {/* Główny CTA */}
                  <Link
                    href="/sklep"
                    className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-none border-0 bg-white font-gilroy font-semibold uppercase tracking-[0.2em] !text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
      </div>

      {/* Karuzela — stała wysokość treści, zawsze widoczna pod hero w ramach 100svh */}
      {children && (
        <div className="relative z-20 w-full shrink-0">
          {children}
        </div>
      )}
    </section>
  );
}
