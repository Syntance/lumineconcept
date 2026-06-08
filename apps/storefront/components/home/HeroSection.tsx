import Image from "next/image";

import { HeroPortalContent } from "./HeroPortalContent";

/** Wymiary pliku `public/images/hero-main-wall.png` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/**
 * Hero z napisami i CTA — rozmiary w `vw`, pozycja w `%`.
 * Portal dopasowuje się do bloku tekst + CTA (patrz HeroPortalContent).
 */
export function HeroSection({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative flex w-full flex-col overflow-x-hidden">
      <div className="relative w-full overflow-x-hidden">
        <Image
          src="/images/hero-main-wall.png"
          alt=""
          width={HERO_BG_WIDTH}
          height={HERO_BG_HEIGHT}
          priority
          sizes="100vw"
          unoptimized
          className="block h-auto w-full select-none"
        />

        {/* Lekki gradient od lewej pod biały tekst */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/45 via-black/15 to-transparent"
          aria-hidden
        />

        <HeroPortalContent />
      </div>

      {/* Karuzela — pod grafiką, bez wymuszania pełnej wysokości viewportu */}
      {children && (
        <div className="relative z-20 w-full shrink-0">{children}</div>
      )}
    </section>
  );
}
