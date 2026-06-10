import Image from "next/image";

import { Breadcrumbs, BREADCRUMBS_ALIGN_CLASS } from "@/components/common/Breadcrumbs";
import { HeroPortalContent } from "@/components/home/HeroPortalContent";
import { LOGO_HERO_PORTAL } from "@/components/home/hero-portal-config";
import { cn } from "@/lib/utils";

/** Wymiary `public/images/categories/logo-hero-bg.png` — przy podmianie grafiki zaktualizuj. */
const LOGO_HERO_BG_WIDTH = 1024;
const LOGO_HERO_BG_HEIGHT = 384;

/**
 * Hero kategorii „Tablice z logo” — ten sam portal + skala co HP, portal wyśrodkowany.
 */
export function LogoCategoryHeroSection() {
  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      <div className="relative w-full overflow-x-hidden max-lg:aspect-[5/6] max-lg:max-h-[min(72vh,34rem)] max-lg:min-h-[22rem] lg:aspect-[2560/966] lg:max-h-[966px]">
        <Image
          src="/images/categories/logo-hero-bg.png"
          alt=""
          width={LOGO_HERO_BG_WIDTH}
          height={LOGO_HERO_BG_HEIGHT}
          priority
          sizes="100vw"
          className="block h-auto w-full select-none max-lg:absolute max-lg:inset-0 max-lg:h-full max-lg:w-full max-lg:object-cover max-lg:object-[45%_55%] lg:absolute lg:inset-0 lg:h-full lg:w-full lg:object-cover lg:object-[48%_58%]"
        />

        <div
          className="pointer-events-none absolute inset-0 hidden bg-black/35 lg:block"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-0 bg-brand-900/50 lg:hidden"
          aria-hidden
        />

        <div className={cn("absolute inset-x-0 top-0 z-20 pt-5 lg:pt-6", BREADCRUMBS_ALIGN_CLASS)}>
          <Breadcrumbs
            className="mb-0 text-sm [&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white"
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Tablice z logo" },
            ]}
          />
        </div>

        <HeroPortalContent align="center" content={LOGO_HERO_PORTAL} portalSize="home" />
      </div>
    </section>
  );
}
