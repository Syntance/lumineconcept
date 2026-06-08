import Link from "next/link";
import Image from "next/image";
import { Instagram } from "lucide-react";
import { getSiteSettings } from "@/lib/sanity/client";
import {
  homepageInstagramTilesFromSettings,
  type HomepageInstagramTile,
} from "@/lib/homepage-instagram-tiles";

const IG_PROFILE = "https://instagram.com/lumineconcept";

/** Wymiary `public/images/monia-branding-cta-bg.png` — przy podmianie zdjęcia zaktualizuj. */
const BRANDING_BG_WIDTH = 1024;
const BRANDING_BG_HEIGHT = 406;

const SHOP_CTA_CLASS =
  "inline-flex items-center justify-center rounded-none border font-gilroy font-medium uppercase tracking-[0.2em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const IG_GRID_SLOTS = 6;

function BrandingHeading({ className = "" }: { className?: string }) {
  return (
    <>
      <h2
        className={`m-0 font-binerka font-bold uppercase leading-[1.1] tracking-[0.06em] text-brand-800 ${className}`}
      >
        Gotowa na branding,
      </h2>
      <p className="m-0 font-gilroy text-lg font-light leading-snug text-brand-800 sm:text-xl">
        który wyróżni Twój salon?
      </p>
    </>
  );
}

function BrandingShopLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/sklep"
      className={`${SHOP_CTA_CLASS} border-brand-800 bg-transparent text-brand-800 hover:bg-brand-800 hover:text-white ${className}`}
    >
      Zobacz sklep &rarr;
    </Link>
  );
}

function BrandingContact({ layout }: { layout: "stack" | "inline" }) {
  const email = (
    <a
      href="mailto:kontakt@lumineconcept.pl"
      className="text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
    >
      kontakt@lumineconcept.pl
    </a>
  );
  const ig = (
    <a
      href="https://ig.me/m/lumineconcept"
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
    >
      @lumineconcept
    </a>
  );

  if (layout === "stack") {
    return (
      <div className="flex flex-col items-center gap-2 text-sm text-brand-600">
        <span>Wolisz napisać?</span>
        {email}
        {ig}
      </div>
    );
  }

  return (
    <p className="m-0 text-center text-brand-600">
      Wolisz napisać? {email}
      <span className="mx-1.5 text-brand-400">&middot;</span>
      {ig}
    </p>
  );
}

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

/**
 * Footer CTA + sekcja „Jesteśmy na Instagramie”.
 * Desktop: tło + overlay w % kadru; mobile: sam blok treści bez zdjęcia.
 */
export async function FooterCTA() {
  const settings = await getSiteSettings();
  const igPosts = homepageInstagramTilesFromSettings(settings);

  return (
    <>
      <section id="footer-cta" className="relative isolate overflow-x-hidden">
        {/* Mobile — bez zdjęcia tła */}
        <div className="bg-brand-50 px-4 py-12 lg:hidden">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 text-center">
            <div className="flex flex-col gap-3">
              <BrandingHeading className="text-[1.65rem] sm:text-[1.85rem]" />
            </div>

            <BrandingShopLink className="w-full max-w-[17.5rem] whitespace-nowrap px-6 py-3.5 text-[11px] leading-none" />

            <BrandingContact layout="stack" />
          </div>
        </div>

        {/* Desktop — zdjęcie + overlay */}
        <div className="relative hidden w-full overflow-hidden lg:block">
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
            className="absolute z-10 flex flex-col items-center text-center"
            style={{
              left: "14%",
              top: "26%",
              width: "34%",
              gap: "clamp(14px, 1.4vw, 24px)",
            }}
          >
            <h2
              className="m-0 font-binerka font-bold uppercase leading-[1.1] tracking-[0.06em] text-brand-800"
              style={{
                fontSize: "clamp(22px, 2.2vw, 40px)",
              }}
            >
              Gotowa na branding,
            </h2>
            <p
              className="m-0 font-gilroy font-light leading-snug text-brand-800"
              style={{
                fontSize: "clamp(18px, 1.85vw, 34px)",
                letterSpacing: "0.05em",
              }}
            >
              który wyróżni Twój salon?
            </p>

            <Link
              href="/sklep"
              className={`${SHOP_CTA_CLASS} whitespace-nowrap border-brand-800 bg-transparent text-brand-800 hover:bg-brand-800 hover:text-white`}
              style={{
                fontSize: "clamp(10px, 0.85vw, 14px)",
                lineHeight: 1.15,
                paddingLeft: "clamp(20px, 1.8vw, 32px)",
                paddingRight: "clamp(20px, 1.8vw, 32px)",
                paddingTop: "clamp(10px, 0.9vw, 14px)",
                paddingBottom: "clamp(10px, 0.9vw, 14px)",
                marginTop: "clamp(8px, 0.8vw, 16px)",
              }}
            >
              Zobacz sklep &rarr;
            </Link>
          </div>

          <div
            className="absolute z-10"
            style={{
              left: "14%",
              width: "34%",
              bottom: "10%",
              fontSize: "clamp(11px, 0.75vw, 16px)",
            }}
          >
            <BrandingContact layout="inline" />
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
