/** Gilroy — px na mobile/tablet; od lg brandbook (mm + tracking), jak 17 czerwca. */
export const ABOUT_BODY_TEXT_CLASS =
  "font-gilroy text-[17px] leading-[1.55] tracking-[0.04em] lg:text-[4.56mm] lg:leading-[6.83mm] lg:tracking-[0.06em]" as const;

/** Intro mobile — treść sekcji; alias: wszystkie sekcje mobile. */
export const ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS =
  "max-lg:text-[calc(4.56mm-3px)] max-lg:leading-[calc(6.83mm-4px)]" as const;

/** @deprecated Alias — ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS */
export const ABOUT_INTRO_MOBILE_BODY_TEXT_CLASS = ABOUT_SECTION_MOBILE_BODY_TEXT_CLASS;

/** Binerka — nagłówki sekcji treści (intro, misja itd.). */
export const ABOUT_SECTION_HEADING_CLASS =
  "font-binerka text-3xl uppercase tracking-[0.14em] text-brand-800 sm:text-4xl lg:text-5xl" as const;

/** Nagłówek obok zdjęcia na mobile/tablet — ten sam rytm co intro „O NAS”. */
export const ABOUT_SECTION_MOBILE_BESIDE_IMAGE_HEADING_CLASS =
  "mb-0 max-w-full max-lg:text-3xl sm:text-5xl lg:mb-8 xl:text-6xl max-xl:mb-6" as const;

/** Pionowy napis boczny przy zdjęciu intro (~2.4× bazowy 0.65rem, kolor nagłówków). */
export const ABOUT_SIDE_CAPTION_CLASS =
  "font-gilroy text-[calc(0.65rem*2.396)] font-semibold uppercase tracking-[0.175em] text-brand-800 [writing-mode:vertical-rl]" as const;

/** Podpis pod zdjęciem — skala mobile (−20%, jak blok zdjęcia). */
export const ABOUT_SECTION_LABEL_MOBILE_CLASS =
  "max-lg:px-2.5 max-lg:py-1.5 max-lg:text-[calc(4.56mm*0.8)] max-lg:leading-[calc(6.83mm*0.8)]" as const;
