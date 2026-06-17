/** Gilroy — wartości z brandbooku (mm + tracking 60 → 0.06em). */
export const ABOUT_BODY_TEXT_CLASS =
  "font-gilroy text-[4.56mm] leading-[6.83mm] tracking-[0.06em]" as const;

/** Binerka — nagłówki sekcji treści (intro, misja itd.). */
export const ABOUT_SECTION_HEADING_CLASS =
  "font-binerka text-4xl tracking-[0.14em] text-brand-800 sm:text-5xl lg:text-6xl" as const;

/** Pionowy napis boczny przy zdjęciu intro (~2.4× bazowy 0.65rem, kolor nagłówków). */
export const ABOUT_SIDE_CAPTION_CLASS =
  "font-gilroy text-[calc(0.65rem*2.396)] font-semibold uppercase tracking-[0.175em] text-brand-800 [writing-mode:vertical-rl]" as const;
