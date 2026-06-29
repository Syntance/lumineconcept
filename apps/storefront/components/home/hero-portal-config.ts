export type HeroPortalAlign = "left" | "center";

/** `home` — wymiary portalu jak na stronie głównej, niezależnie od treści. */
export type HeroPortalSize = "content" | "home";

export type HeroPortalContentConfig = {
  headline: string;
  subtitle?: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  ctaAriaLabel?: string;
  headlineUppercase?: boolean;
  /** Strzałka w dół na końcu etykiety CTA (np. scroll do formularza). */
  ctaShowDownArrow?: boolean;
};

export const HOME_HERO_PORTAL: HeroPortalContentConfig = {
  headline: "CONCEPT",
  subtitle: "Wyróżnij swój salon",
  description: "Tablice z logo, cenniki i oznaczenia z plexi",
  ctaLabel: "Zobacz produkty",
  ctaHref: "/sklep",
};

export const LOGO_HERO_PORTAL: HeroPortalContentConfig = {
  headline: "Tablica z logo",
  description:
    "Logo Twojej marki zrealizowane w postaci kreatywnej ozdobnej tablicy, którą możesz zamieścić na ścianie",
  ctaLabel: "Uzyskaj wycenę",
  ctaHref: "#formularz",
  ctaAriaLabel: "Przewiń do formularza — zamów tablicę z logo",
  headlineUppercase: true,
  ctaShowDownArrow: true,
};

/** Wspólny styl przycisku CTA hero — brand-800 jak nagłówki sekcji (np. Bestsellery). */
const HERO_SHOP_CTA_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border border-brand-800/20 bg-white font-gilroy font-semibold uppercase tracking-[0.2em] text-brand-800 shadow-none outline-none transition-colors hover:bg-brand-50 hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2";

export const HERO_SHOP_CTA_MOBILE_CLASS = `${HERO_SHOP_CTA_BASE} w-full max-w-[17.5rem] px-6 py-3.5 text-[11px] focus-visible:ring-offset-brand-800`;

export const HERO_SHOP_CTA_DESKTOP_CLASS = `${HERO_SHOP_CTA_BASE} px-7 py-3 text-[13px] leading-[1.15] focus-visible:ring-offset-transparent`;
