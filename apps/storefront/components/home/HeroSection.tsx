import Image from "next/image";

import { HeroPortalContent } from "./HeroPortalContent";

/** Wymiary pliku `public/images/hero-main-wall.webp` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/**
 * Hero — desktop: portal + overlay z lewej; mobile: niższy blok, zdjęcie mniejsze i w prawo.
 * Desktop: max. wysokość = wysokość pliku źródłowego (ultrawide nie rozciąga hero w nieskończoność).
 */
export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      <div
        className="relative w-full overflow-x-hidden max-lg:aspect-[4/5] max-lg:max-h-[min(58vh,30rem)] max-lg:min-h-[17.5rem] lg:aspect-[2560/966] lg:max-h-[966px]"
      >
        <Image
          src="/images/hero-main-wall.webp"
          alt=""
          width={HERO_BG_WIDTH}
          height={HERO_BG_HEIGHT}
          priority
          fetchPriority="high"
          sizes="100vw"
          className="block h-auto w-full select-none max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:left-auto max-lg:h-full max-lg:w-[min(78%,19.5rem)] max-lg:object-cover max-lg:object-[62%_center] lg:absolute lg:inset-0 lg:h-full lg:w-full lg:object-cover lg:object-[38%_center]"
        />

        {/* Desktop — czytelność tekstu z lewej */}
        <div
          className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-black/45 via-black/15 to-transparent lg:block"
          aria-hidden
        />

        {/* Mobile — ciemniejsza lewa połowa pod wyśrodkowany tekst */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-brand-900/80 via-brand-900/55 to-brand-900/20 lg:hidden"
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
