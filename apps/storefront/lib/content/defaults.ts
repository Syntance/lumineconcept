import type {
	AboutPageContent,
	GlobalContent,
	BrandingCtaContent,
	HeroContent,
	PageContentMap,
	SiteSettings,
} from "./types";

/**
 * Fallbacki TYLKO na copy / strukturę — bez URL-i obrazów.
 * Wszystkie media (hero, galerie, kafelki, OG…) pochodzą z CMS → R2 przy zapisie,
 * a na produkcji są lokalizowane w prebuild do `/public/images/cms/` (mapa URL).
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
	title: "Lumine Concept",
	description:
		"Produkty z plexi i rozwiązania brandingowe dla salonów beauty. Tablice z logo, stojaki, organizery, tablice cennikowe i więcej.",
	titleTemplate: "%s | Lumine Concept",
	trustBar: {
		followers: "25 000+",
		realizations: "6 000+",
		shippingLabel: "Realizacja ok. 10 dni rob.",
	},
	checkoutCallout: {
		enabled: true,
		title: "UWAGA",
		message:
			"Nie ingerujemy w przesłany tekst. Prosimy o dokładne sprawdzenie poprawności treści.",
		confirmLabel: "Rozumiem, kontynuuj",
	},
	socialLinks: {
		instagram: "https://www.instagram.com/lumine.concept/",
		facebook: "https://www.facebook.com/profile.php?id=100063769314849",
	},
};

export const HOME_HERO_DEFAULT: HeroContent = {
	headline: "CONCEPT",
	subtitle: "Wyróżnij swój salon",
	description: "Tablice z logo, cenniki i oznaczenia z plexi",
	ctaLabel: "Zobacz produkty",
	ctaHref: "/sklep",
};

export const BRANDING_CTA_DEFAULT: BrandingCtaContent = {};

export const LOGO_HERO_DEFAULT: HeroContent = {
	headline: "Tablica z logo",
	description:
		"Logo Twojej marki zrealizowane w postaci kreatywnej ozdobnej tablicy, którą możesz zamieścić na ścianie",
	ctaLabel: "Uzyskaj wycenę",
	ctaHref: "#formularz",
	ctaAriaLabel: "Przewiń do formularza — zamów tablicę z logo",
	headlineUppercase: true,
	ctaShowDownArrow: true,
};

export const ABOUT_HERO_DEFAULT: HeroContent = {
	headline: "O NAS",
	subtitle: "Kim jesteśmy?",
	description: " ",
	ctaLabel: "Zobacz sklep",
	ctaHref: "/sklep",
};

export const ABOUT_PAGE_DEFAULT: AboutPageContent = {
	sideCaption: "Zapoznaj się z nami",
	introHeading: "O NAS",
	introParagraphs: [
		"Lumine to marka tworzona przez dwie siostry, która powstała z potrzeby podnoszenia standardów estetyki w branży beauty.",
		"Projektujemy z wyczuciem i konsekwencją, dbając o spójność, detal i profesjonalny odbiór.",
		"Pomagamy salonom budować wizerunek premium w praktyce: porządkować przestrzeń, czytelnie prowadzić klienta i wzmacniać pierwsze wrażenie.",
	],
	introImageAlt: "Założycielki Lumine Concept przy wspólnej pracy nad projektem",
	introLabel: "my",
	missionParagraphs: [
		"Naszą misją jest podnosić doświadczenie klientów\nw salonach beauty poprzez dopracowane detale\ni spójną komunikację w przestrzeni.\nTworzymy rozwiązania, które pomagają budować zaufanie,\nporządek i profesjonalny odbiór marki —\nod wejścia, przez recepcję, aż po strefy zabiegowe.\nStawiamy na jakość, czytelność i estetykę,\nktóre realnie pracują na wizerunek salonu każdego dnia.",
	],
	missionImageAlt: "Praca nad tablicą z logo w pracowni Lumine Concept",
	missionLabel: "nasza misja",
	closingImageAlt: "Gotowa tablica z logo salonu beauty — realizacja Lumine Concept",
};

export const DEFAULT_PAGE_CONTENT: PageContentMap = {
	home: { hero: HOME_HERO_DEFAULT, brandingCta: BRANDING_CTA_DEFAULT },
	"logo-3d": { hero: LOGO_HERO_DEFAULT },
	shop: {},
	"o-nas": { hero: ABOUT_HERO_DEFAULT, about: ABOUT_PAGE_DEFAULT },
};

export const DEFAULT_GLOBAL_CONTENT: GlobalContent = {
	salonLogos: [
		{ id: "fallback-1", name: "Sabrija Store", logoUrl: "/images/logos/sabrija-store.png", order: 0 },
		{ id: "fallback-2", name: "Salon Mia", order: 1 },
		{ id: "fallback-3", name: "Beauty Lab", order: 2 },
	],
};
