import Image from "next/image";

import { HeroPortalContent } from "./HeroPortalContent";

/** Wymiary pliku `public/images/hero-main-wall.webp` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/**
 * Hero — desktop: ultrawide + portal; mobile: osobny crop 4:5 (dedicated asset).
 * Mobile asset: `hero-main-wall-mobile.webp` (1080×1350), kadrowany ~50% szer. oryginału.
 */
export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      <div
        className="relative w-full overflow-x-hidden max-lg:aspect-[4/5] max-lg:max-h-[min(62vh,32rem)] max-lg:min-h-[18rem] lg:aspect-[2560/966] lg:max-h-[966px]"
      >
        <Image
          src="/images/hero-main-wall-mobile.webp"
          alt=""
          width={1080}
          height={1350}
          priority
          fetchPriority="high"
          sizes="100vw"
          className="absolute inset-0 h-full w-full select-none object-cover object-center lg:hidden"
        />
        <Image
          src="/images/hero-main-wall.webp"
          alt=""
          width={HERO_BG_WIDTH}
          height={HERO_BG_HEIGHT}
          priority
          fetchPriority="high"
          sizes="100vw"
          className="absolute inset-0 hidden h-full w-full select-none object-cover object-[38%_center] lg:block"
        />

        {/* Desktop — czytelność tekstu z lewej */}
        <div
          className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-black/45 via-black/15 to-transparent lg:block"
          aria-hidden
        />

        {/* Mobile — gradient od dołu pod copy; góra kadru = produkt */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-900/85 via-brand-900/35 to-transparent lg:hidden"
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
