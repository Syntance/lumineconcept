import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/sanity/client";
import { heroPanelScale } from "@/components/home/hero-shadow-panel";
import {
  homepageInstagramTilesFromSettings,
  type HomepageInstagramTile,
} from "@/lib/homepage-instagram-tiles";


const IG_PROFILE = "https://instagram.com/lumineconcept";

/** Wymiary `public/images/monia-branding-cta-bg.png` — przy podmianie zdjęcia zaktualizuj. */
const BRANDING_BG_WIDTH = 1024;
const BRANDING_BG_HEIGHT = 384;

/** Przy szerokości kadru = BRANDING_BG_WIDTH px bazowy nagłówek ~40px (`cqw` jak hero HP). */
const BRANDING_REF_HEAD_PX = 40;
/** Jednolita korekta sekcji (np. −10 % dla copy + przycisku + stopki przy tym bannerze). */
const BRANDING_SECTION_SCALE = 0.9;

const BRANDING_LINE2_TO_LINE1 = 0.94; // druga linia odrobinę mniejsza niż pierwsza (jak na ref.)
const BRANDING_BTN_TO_HEAD = 14.2 / 40;
const BRANDING_BODY_TO_HEAD = 18 / 40; // ~ text-lg
const BRANDING_MT_BLOCKS_TO_HEAD = 2.5 * 16 / 40; // ~ mt-10

/** Klasy przycisku — `--banner-btn-fs` skalowane względem `--banner-fs` (bazowy rozmiar pierwszej linii). */
const SHOP_CTA_CLASS =
  "inline-flex items-center justify-center whitespace-nowrap rounded-none border font-gilroy font-medium uppercase tracking-[0.2em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const IG_GRID_SLOTS = 6;

function InstagramGrid({
  posts,
}: {
  posts: HomepageInstagramTile[];
}) {
  return (
    <div className="mt-10 grid grid-cols-3 gap-2 max-w-xl mx-auto sm:grid-cols-6">
      {Array.from({ length: IG_GRID_SLOTS }, (_, i) => {
        const post = posts[i];
        if (post) {
          return (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Otwórz post na Instagramie"
              className="group relative aspect-square block overflow-hidden bg-brand-100 outline-none ring-brand-800 transition-[transform,box-shadow] hover:z-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Image
                src={post.imageUrl}
                alt={post.alt}
                fill
                sizes="(max-width: 640px) 34vw, 120px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading={i < 3 ? "eager" : "lazy"}
              />
            </a>
          );
        }
        return (
          <a
            key={`ig-placeholder-${i}`}
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lumine Concept na Instagramie"
            className="aspect-square bg-brand-100 hover:bg-brand-200 transition-colors flex items-center justify-center"
          >
            <Instagram className="h-4 w-4 text-brand-400" />
          </a>
        );
      })}
    </div>
  );
}

/** Treść nad zdjęciem — rozmiary z `var(--banner-fs)` z `cqw` względem kadru jak hero HP. */
function BrandingBannerCopy() {
  const scale = heroPanelScale;

  return (
    <div className="flex min-h-0 flex-col items-start justify-center px-[2.16cqw] pb-[min(6cqw,2.5rem)] pt-[min(12cqw,5rem)]">
      {/* Szerokość = max napisów; druga linia i CTA wyśrodkowane w obrębie tej szpalty (jak przy pierwszej linii). */}
      <div className="flex w-fit max-w-[min(90cqw,42rem)] flex-col items-center text-center">
        <h2
          className="m-0 text-center text-balance font-binerka font-medium uppercase leading-[1.1] tracking-[0.06em] text-brand-800"
          style={{ fontSize: "var(--banner-fs)" }}
        >
          Gotowa na branding,
        </h2>
        <p
          className="m-0 text-center text-balance font-gilroy font-light leading-snug text-brand-800"
          style={{
            fontSize: `calc(var(--banner-fs) * ${BRANDING_LINE2_TO_LINE1})`,
            fontWeight: 300,
            marginTop: 0,
            letterSpacing: `calc(var(--banner-fs) * ${2 / BRANDING_REF_HEAD_PX})`,
          }}
        >
          który wyróżni Twój salon?
        </p>

        <div
          className="flex w-full justify-center"
          style={{ marginTop: `calc(var(--banner-fs) * ${BRANDING_MT_BLOCKS_TO_HEAD})` }}
        >
          <Link
            href="/sklep"
            className={`${SHOP_CTA_CLASS} border-brand-800 bg-transparent text-brand-800 hover:bg-brand-800 hover:text-white`}
            style={
              {
                ["--banner-btn-fs"]: `calc(var(--banner-fs) * ${BRANDING_BTN_TO_HEAD})`,
                fontSize: "var(--banner-btn-fs)",
                lineHeight: 1.15,
                paddingLeft: `${scale.ctaPadX}em`,
                paddingRight: `${scale.ctaPadX}em`,
                paddingTop: `${scale.ctaPadY}em`,
                paddingBottom: `${scale.ctaPadY}em`,
                borderRadius: 0,
              } as CSSProperties
            }
          >
            Zobacz sklep &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Footer CTA + sekcja „Jesteśmy na Instagramie”.
 * Kafelki IG z Sanity: Ustawienia strony → Social Media → „Instagram — kafelki na stronie głównej”.
 */
export async function FooterCTA() {
  const settings = await getSiteSettings();
  const igPosts = homepageInstagramTilesFromSettings(settings);

  return (
    <>
      <section id="footer-cta" className="relative isolate overflow-x-hidden">
        {/* Ta sama idea co hero HP: szerokość zdjęcia = kontener dla `cqw`; treść na absolutnej nakładce. */}
        <div className="relative w-full isolation-isolate @container overflow-x-hidden">
          <Image
            src="/images/monia-branding-cta-bg.png"
            alt=""
            width={BRANDING_BG_WIDTH}
            height={BRANDING_BG_HEIGHT}
            sizes="100vw"
            unoptimized
            priority={false}
            className="block h-auto w-full select-none"
          />

          <div
            className="absolute inset-0 z-10 grid grid-rows-[1fr_auto]"
            style={
              {
                "--banner-fs": `calc(100cqw * ${BRANDING_REF_HEAD_PX / BRANDING_BG_WIDTH} * ${BRANDING_SECTION_SCALE})`,
              } as CSSProperties
            }
          >
            <BrandingBannerCopy />

            <div className="flex justify-start px-[2.16cqw] pb-[min(8cqw,3rem)] pt-[min(12cqw,4rem)]">
              <p
                className="max-w-[min(90cqw,42rem)] text-left text-balance text-brand-600"
                style={{ fontSize: `calc(var(--banner-fs) * ${BRANDING_BODY_TO_HEAD})` }}
              >
                Wolisz napisać?{" "}
                <a
                  href="mailto:kontakt@lumineconcept.pl"
                  className="wrap-break-word text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
                >
                  kontakt@lumineconcept.pl
                </a>
                <span className="mx-1.5 text-brand-400">&middot;</span>
                <a
                  href="https://ig.me/m/lumineconcept"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
                >
                  @lumineconcept
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
            Jesteśmy na Instagramie
          </h2>
          <div className="mt-3 mx-auto h-px w-12 bg-accent" />

          <InstagramGrid posts={igPosts} />

          <a
            href={IG_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-[14.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Zobacz nasze realizacje &rarr;
          </a>
        </div>
      </section>
    </>
  );
}
