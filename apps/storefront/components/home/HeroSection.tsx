import Image from "next/image";

import { HeroPortalContent } from "./HeroPortalContent";
import { HeroPortalMobile } from "./HeroPortalMobile";

/** Wymiary pliku `public/images/hero-main-wall.webp` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/** Mobile crop 4:5 — kadrowany ~62% szer. oryginału (v=10 bust cache). */
const HERO_MOBILE_SRC = "/images/hero-main-wall-mobile.webp?v=10";

/**
 * Hero — desktop: ultrawide + overlay; mobile: zdjęcie, pod spodem brązowy blok z copy + CTA.
 */
export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      {/* Mobile — zdjęcie nad copy */}
      <div className="flex flex-col lg:hidden">
        <Image
          src={HERO_MOBILE_SRC}
          alt=""
          width={1080}
          height={1350}
          priority
          fetchPriority="high"
          sizes="100vw"
          unoptimized
          className="block h-auto w-full select-none"
        />
        <HeroPortalMobile />
      </div>

      {/* Desktop — portal + overlay */}
      <div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
        <Image
          src="/images/hero-main-wall.webp"
          alt=""
          width={HERO_BG_WIDTH}
          height={HERO_BG_HEIGHT}
          priority
          fetchPriority="high"
          sizes="100vw"
          className="absolute inset-0 h-full w-full select-none object-cover object-[38%_center]"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/45 via-black/15 to-transparent"
          aria-hidden
        />

        <HeroPortalContent />
      </div>

      {children && (
        <div className="relative z-20 w-full shrink-0">{children}</div>
      )}
    </section>
  );
}
