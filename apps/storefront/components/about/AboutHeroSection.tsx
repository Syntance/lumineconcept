import Image from "next/image";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
	ABOUT_HERO_MOBILE_HEADLINE_PADDING,
	ABOUT_PAGE_CONTENT_MAX,
	ABOUT_PAGE_GUTTER,
} from "@/components/about/about-media";
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
          className="object-cover object-center opacity-90 max-lg:motion-safe:animate-in max-lg:motion-safe:fade-in max-lg:motion-safe:duration-500"
          draggable={false}
        />
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-b from-brand-900/35 via-brand-900/10 to-brand-900/55",
          "max-lg:from-brand-900/50 max-lg:via-brand-900/15 max-lg:to-brand-900/60",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 w-full",
          ABOUT_PAGE_GUTTER,
          "max-lg:text-left",
          "lg:mx-auto lg:max-w-7xl lg:px-4 lg:max-xl:pl-10 lg:max-xl:pr-5 sm:max-xl:pl-12",
        )}
      >
        <div className={cn(ABOUT_PAGE_CONTENT_MAX, "lg:mx-0 lg:max-w-none lg:px-0")}>
          <div className="pt-8 sm:pt-10">
            <Breadcrumbs
              className="mb-0 font-gilroy text-sm [&_a]:text-white/75 [&_a:hover]:text-white [&_span]:text-white/90"
              items={[
                { label: "Strona główna", href: "/" },
                { label: "O nas" },
              ]}
            />
          </div>

          <div className={cn("max-w-xl max-lg:mr-auto", ABOUT_HERO_MOBILE_HEADLINE_PADDING, "lg:pb-48 lg:pt-16")}>
            <h1
              id="about-hero-heading"
              className="font-binerka text-5xl leading-none tracking-[0.12em] text-white sm:text-6xl lg:text-7xl max-lg:text-[2.75rem]"
            >
              {hero.headline}
            </h1>
            {hero.subtitle ? (
              <p className="-mt-0.5 font-gilroy text-2xl font-normal leading-tight tracking-[0.06em] text-brand-100 sm:text-3xl lg:text-4xl max-lg:mt-2 max-lg:text-xl">
                {hero.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
