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
};
