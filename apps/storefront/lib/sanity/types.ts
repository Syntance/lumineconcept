export interface SanityImage {
  asset: {
    _id: string;
    url: string;
    metadata: {
      dimensions: { width: number; height: number };
      lqip: string;
    };
  };
  alt?: string;
}

export interface SanityImageRef {
  asset: {
    _id: string;
    url: string;
  };
}

export interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: SanityImageRef;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

/** Identyfikator strony — patrz `sanity/schemas/objects/page-context.ts` */
export type PageContext =
  | "home"
  | "shop"
  | "logo-3d"
  | "gotowe-wzory"
  | "tla-do-tablic"
  | "tablice-cenowe"
  | "global";

/** Kategoria realizacji — patrz `sanity/schemas/realization-categories.ts` */
export type RealizationCategory =
  | "tablica-z-logo"
  | "tla-do-tablic"
  | "gotowe-wzory"
  | "tablice-cenowe"
  | "inne";

/** Jedno zdjęcie z tablicy `photos` w dokumencie `realizationGallery`. */
export interface RealizationPhoto {
  _key: string;
  image: SanityImage;
}

export interface Testimonial {
  _id: string;
  page: PageContext;
  name: string;
  role?: string;
  company: string;
  quote: string;
  image?: SanityImage;
  rating: number;
  order?: number;
}

export interface FAQ {
  _id: string;
  page: PageContext;
  question: string;
  answer: string;
  order?: number;
}

export interface SalonLogo {
  _id: string;
  name: string;
  logo?: SanityImageRef;
  order: number;
}

export interface ProductFaq {
  _id: string;
  question: string;
  answer: string;
  order: number;
}

export interface TrustBar {
  followers?: string;
  realizations?: string;
  shippingLabel?: string;
}

export interface CheckoutCallout {
  enabled?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

export interface SiteSettings {
  title: string;
  description: string;
  announcementBar?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
  trustBar?: TrustBar;
  checkoutCallout?: CheckoutCallout;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  footerText?: string;
  seo?: SeoMeta;
  titleTemplate?: string;
  defaultOgImage?: SanityImageRef;
  googleSiteVerification?: string;
}
