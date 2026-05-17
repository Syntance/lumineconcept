import Image from "next/image";
import Link from "next/link";
import { HeroShadowPanel, heroPanelScale } from "./hero-shadow-panel";

/** Wymiary pliku `public/images/hero-main-wall.png` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 1024;
const HERO_BG_HEIGHT = 384;

/**
 * Hero + karuzela pod spodem:
 *   - Wysokość bloku grafiki = naturalny aspect ratio zdjęcia (`width`/`height` + `w-full h-auto`),
 *     nie `100svh`.
 *   - Treść w HeroShadowPanel skaluje się przez `cqw` jak wcześniej.
 */

export function HeroSection({ children }: { children?: React.ReactNode }) {
  const scale = heroPanelScale;

  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      <div className="relative w-full">
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

        {/* Lekki gradient od lewej pod biały tekst — bez backdrop-blur (ostre zdjęcie). */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/45 via-black/15 to-transparent"
          aria-hidden
        />

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
                        Tablice z logo, cenniki i oznaczenia z plexi
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

      {/* Karuzela — pod grafiką, bez wymuszania pełnej wysokości viewportu */}
      {children && (
        <div className="relative z-20 w-full shrink-0">{children}</div>
      )}
    </section>
  );
}
