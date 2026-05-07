import Image from "next/image";
import Link from "next/link";
import { HeroShadowPanel, heroPanelScale } from "./hero-shadow-panel";

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

export function HeroSection({ children }: { children?: React.ReactNode }) {
  const scale = heroPanelScale;

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
          <HeroShadowPanel align="left">
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
                        Tablica z logo, cenniki i oznaczenia z plexi
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
          </HeroShadowPanel>
        </div>
      </div>

      {/* Karuzela — stała wysokość treści, zawsze widoczna pod hero w ramach 100svh */}
      {children && (
        <div className="relative z-20 w-full shrink-0">{children}</div>
      )}
    </section>
  );
}
