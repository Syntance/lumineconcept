import Image from "next/image";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ABOUT_PAGE_GUTTER } from "@/components/about/about-media";
import type { ResolvedAboutHero } from "@/lib/content/about";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { cn } from "@/lib/utils";

type AboutHeroSectionProps = {
  hero: ResolvedAboutHero;
};

export function AboutHeroSection({ hero }: AboutHeroSectionProps) {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative overflow-hidden bg-brand-900 text-white"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src={hero.backgroundUrl}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={90}
          unoptimized={isCmsImageUnoptimized(hero.backgroundUrl)}
          className="object-cover object-center opacity-90"
          draggable={false}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-brand-900/35 via-brand-900/10 to-brand-900/55"
        aria-hidden
      />

      <div className={cn("relative z-10 pt-8 sm:pt-10", ABOUT_PAGE_GUTTER)}>
        <Breadcrumbs
          className="mb-0 font-gilroy text-sm [&_a]:text-white/75 [&_a:hover]:text-white [&_span]:text-white/90"
          items={[
            { label: "Strona główna", href: "/" },
            { label: "O nas" },
          ]}
        />
      </div>

      <div className={cn("relative z-10 mx-auto max-w-7xl pb-32 pt-10 sm:pb-40 sm:pt-14 lg:pb-48 lg:pt-16", ABOUT_PAGE_GUTTER)}>
        <div className="max-w-xl">
          <h1
            id="about-hero-heading"
            className="font-binerka text-5xl leading-none tracking-[0.12em] text-white sm:text-6xl lg:text-7xl"
          >
            {hero.headline}
          </h1>
          {hero.subtitle ? (
            <p className="-mt-0.5 font-gilroy text-2xl font-normal leading-tight tracking-[0.06em] text-brand-100 sm:text-3xl lg:text-4xl">
              {hero.subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
