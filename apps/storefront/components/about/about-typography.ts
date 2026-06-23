/** Gilroy — wartości z brandbooku (mm + tracking 60 → 0.06em). */
export const ABOUT_BODY_TEXT_CLASS =
  "font-gilroy text-[4.56mm] leading-[6.83mm] tracking-[0.06em]" as const;

/** Intro mobile — treść sekcji 1, −2px względem bazowego brandbooku. */
export const ABOUT_INTRO_MOBILE_BODY_TEXT_CLASS =
  "max-md:text-[calc(4.56mm-2px)] max-md:leading-[calc(6.83mm-3px)]" as const;

/** Binerka — nagłówki sekcji treści (intro, misja itd.). */
export const ABOUT_SECTION_HEADING_CLASS =
  "font-binerka text-4xl tracking-[0.14em] text-brand-800 sm:text-5xl lg:text-6xl" as const;

/** Pionowy napis boczny przy zdjęciu intro (~2.4× bazowy 0.65rem, kolor nagłówków). */
export const ABOUT_SIDE_CAPTION_CLASS =
  "font-gilroy text-[calc(0.65rem*2.396)] font-semibold uppercase tracking-[0.175em] text-brand-800 [writing-mode:vertical-rl]" as const;

/** Podpis pod zdjęciem — skala mobile (−20%, jak blok zdjęcia). */
export const ABOUT_SECTION_LABEL_MOBILE_CLASS =
  "max-md:px-2.5 max-md:py-1.5 max-md:text-[calc(4.56mm*0.8)] max-md:leading-[calc(6.83mm*0.8)]" as const;
