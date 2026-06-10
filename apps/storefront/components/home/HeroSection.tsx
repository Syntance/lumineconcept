import Image from "next/image";

import { HeroPortalContent } from "./HeroPortalContent";

/** Wymiary pliku `public/images/hero-main-wall.webp` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/**
 * Hero — desktop: portal + overlay z lewej; mobile: kadrowany obraz + treść na środku.
 * Desktop: max. wysokość = wysokość pliku źródłowego (ultrawide nie rozciąga hero w nieskończoność).
 */
export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      <div
        className="relative w-full overflow-x-hidden max-lg:aspect-[5/6] max-lg:max-h-[min(72vh,34rem)] max-lg:min-h-[22rem] lg:aspect-[2560/966] lg:max-h-[966px]"
      >
        <Image
          src="/images/hero-main-wall.webp"
          alt=""
          width={HERO_BG_WIDTH}
          height={HERO_BG_HEIGHT}
          priority
          fetchPriority="high"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1920px"
          quality={85}
          className="block h-auto w-full select-none max-lg:absolute max-lg:inset-0 max-lg:h-full max-lg:w-full max-lg:object-cover max-lg:object-[42%_center] lg:absolute lg:inset-0 lg:h-full lg:w-full lg:object-cover lg:object-[38%_center]"
        />

        {/* Desktop — czytelność tekstu z lewej */}
        <div
          className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-black/45 via-black/15 to-transparent lg:block"
          aria-hidden
        />

        {/* Mobile — czytelność wyśrodkowanego bloku treści */}
        <div
          className="pointer-events-none absolute inset-0 bg-brand-900/50 lg:hidden"
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
