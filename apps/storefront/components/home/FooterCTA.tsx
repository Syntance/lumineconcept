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
const BRANDING_BG_WIDTH = 2560;
const BRANDING_BG_HEIGHT = 922;

const SHOP_CTA_CLASS =
  "inline-flex items-center justify-center rounded-none border font-gilroy font-medium uppercase tracking-[0.2em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const IG_GRID_SLOTS = 6;

function BrandingHeading({ className = "" }: { className?: string }) {
  return (
    <>
      <h2
        className={`m-0 font-binerka text-3xl font-bold uppercase leading-[1.1] tracking-[0.06em] text-brand-800 lg:text-4xl ${className}`}
      >
        Gotowa na branding,
      </h2>
      <p className="m-0 font-gilroy text-base font-light leading-snug text-brand-800 lg:text-lg">
        który wyróżni Twój salon?
      </p>
    </>
  );
}

function BrandingShopLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/sklep"
      className={`${SHOP_CTA_CLASS} border-brand-800 bg-transparent text-[11px] leading-[1.15] text-brand-800 hover:bg-brand-800 hover:text-white lg:text-[13px] ${className}`}
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
 * Desktop: tło jak hero (aspect + max-h + object-cover); mobile: sam blok treści.
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
              <BrandingHeading />
            </div>

            <BrandingShopLink className="w-full max-w-[17.5rem] whitespace-nowrap px-6 py-3.5" />

            <BrandingContact layout="stack" />
          </div>
        </div>

        {/* Desktop — tło jak hero + overlay */}
        <div className="relative hidden w-full overflow-x-hidden lg:block lg:aspect-[2560/922] lg:max-h-[922px]">
          <Image
            src="/images/monia-branding-cta-bg.png"
            alt=""
            width={BRANDING_BG_WIDTH}
            height={BRANDING_BG_HEIGHT}
            sizes="100vw"
            unoptimized
            priority={false}
            className="absolute inset-0 h-full w-full select-none object-cover object-right"
          />

          <div
            className="absolute z-10 flex flex-col items-center gap-4 text-center"
            style={{
              left: "12%",
              top: "28%",
              width: "36%",
            }}
          >
            <BrandingHeading />

            <BrandingShopLink className="mt-1 whitespace-nowrap px-7 py-3" />
          </div>

          <div
            className="absolute z-10 text-sm text-brand-600"
            style={{
              left: "12%",
              width: "36%",
              bottom: "10%",
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
