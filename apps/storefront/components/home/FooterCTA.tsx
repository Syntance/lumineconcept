import Image from "next/image";
import { Instagram } from "lucide-react";
import { getGlobalContent, getSiteSettings } from "@/lib/content";
import {
	resolveInstagramProfileUrl,
	resolveInstagramTiles,
	resolveSocialLinks,
} from "@/lib/content/cms-wiring";
import type { SocialLinks } from "@moduly/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { SITE_CONTACT } from "@/lib/site-contact";
import { formatInstagramDisplayLabel } from "@/lib/social-links";

const SHOP_CTA_CLASS =
  "inline-flex items-center justify-center rounded-none border font-gilroy font-medium uppercase tracking-[0.2em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

const IG_GRID_SLOTS = 6;

function BrandingHeading({
  className = "",
  align = "center",
}: {
  className?: string;
  align?: "center" | "left";
}) {
  const alignClassName = align === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <div className={`flex flex-col gap-2 ${alignClassName}`}>
      <h2
        className={`m-0 w-fit font-binerka text-3xl font-bold uppercase leading-[1.1] tracking-[0.06em] text-brand-800 xl:text-4xl xl:whitespace-nowrap ${className}`}
      >
        Gotowa na branding,
      </h2>
      <p className="m-0 font-gilroy text-[2rem] font-light leading-snug text-brand-800 xl:text-[2.5rem] xl:whitespace-nowrap">
        który wyróżni Twój salon?
      </p>
    </div>
  );
}

function BrandingShopLink({ className = "" }: { className?: string }) {
  return (
    <a
      href="/sklep"
      className={`${SHOP_CTA_CLASS} border-brand-800 bg-transparent text-[11px] leading-[1.15] text-brand-800 hover:bg-brand-800 hover:text-white lg:text-[13px] ${className}`}
    >
      Zobacz sklep &rarr;
    </a>
  );
}

function BrandingContact({
  layout,
  className = "",
  social,
}: {
  layout: "stack" | "inline";
  className?: string;
  social: SocialLinks;
}) {
  const email = (
    <a
      href={`mailto:${SITE_CONTACT.email}`}
      className="text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
    >
      {SITE_CONTACT.email}
    </a>
  );
  const instagramUrl = social.instagram?.trim();
  const ig = instagramUrl ? (
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-800 underline-offset-2 transition-colors hover:text-brand-900 hover:underline"
    >
      {formatInstagramDisplayLabel(instagramUrl)}
    </a>
  ) : null;

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
    <p className={`m-0 w-fit text-center text-brand-600 ${className}`}>
      Wolisz napisać? {email}
      {ig ? (
        <>
          <span className="mx-1.5 text-brand-400">&middot;</span>
          {ig}
        </>
      ) : null}
    </p>
  );
}

function InstagramGrid({
	posts,
	profileUrl,
}: {
	posts: ReturnType<typeof resolveInstagramTiles>;
	profileUrl: string;
}) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-4 max-w-2xl mx-auto sm:grid-cols-3">
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
              className="group relative aspect-square block overflow-hidden bg-white outline-none ring-brand-800 transition-[transform,box-shadow] hover:z-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src={post.imageUrl}
                  alt={post.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 240px"
                  className="object-cover object-center scale-[1.03] transition-transform duration-300 group-hover:scale-105"
                  loading={i < 3 ? "eager" : "lazy"}
                  unoptimized={isCmsImageUnoptimized(post.imageUrl)}
                />
              </div>
            </a>
          );
        }
        return (
          <a
            key={`ig-placeholder-${i}`}
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lumine Concept na Instagramie"
            className="aspect-square bg-brand-100 hover:bg-brand-200 transition-colors flex items-center justify-center"
          >
            <Instagram className="h-5 w-5 text-brand-400" />
          </a>
        );
      })}
    </div>
  );
}

export async function FooterCTA() {
  const [global, settings] = await Promise.all([
    getGlobalContent(),
    getSiteSettings(),
  ]);
  const social = resolveSocialLinks(settings);
  const igPosts = resolveInstagramTiles(global);
  const igProfile = resolveInstagramProfileUrl(social);

  return (
    <>
      <section id="footer-cta" className="relative isolate overflow-x-hidden">
        <div className="bg-brand-50 px-4 py-12 xl:hidden">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 text-center">
            <BrandingHeading />
            <BrandingShopLink className="mt-10 w-full max-w-[17.5rem] whitespace-nowrap px-6 py-3.5" />
            <BrandingContact layout="stack" social={social} />
          </div>
        </div>
        <div className="hidden h-[540px] w-full overflow-hidden bg-brand-50 xl:block">
          <div className="mx-auto flex h-full max-w-[1360px] items-center justify-center px-8 xl:px-14">
            <div className="flex shrink-0 items-center gap-6">
              <div className="inline-flex shrink-0 flex-col items-center">
                <BrandingHeading align="center" />
                <BrandingShopLink className="mt-10 whitespace-nowrap px-7 py-3" />
                <BrandingContact layout="inline" className="mt-8 text-sm" social={social} />
              </div>
              <div className="relative h-[540px] w-[28rem] shrink-0 overflow-hidden">
                <Image
                  src="/images/branding-cta-model.png"
                  alt=""
                  aria-hidden
                  width={760}
                  height={997}
                  sizes="(max-width: 1280px) 420px, 520px"
                  unoptimized
                  className="pointer-events-none absolute -bottom-[50px] z-10 h-[129.8%] w-auto select-none object-contain object-bottom"
                />
              </div>
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
          <InstagramGrid posts={igPosts} profileUrl={igProfile} />
          <a
            href={igProfile}
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
