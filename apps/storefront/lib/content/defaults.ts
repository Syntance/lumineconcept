import type {
	GlobalContent,
	BrandingCtaContent,
	HeroContent,
	PageContentMap,
	SiteSettings,
} from "./types";

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
};

export const DEFAULT_PAGE_CONTENT: PageContentMap = {
	home: { hero: HOME_HERO_DEFAULT, brandingCta: BRANDING_CTA_DEFAULT },
	"logo-3d": { hero: LOGO_HERO_DEFAULT },
	shop: {
		categoryTiles: [
			{
				title: "Gotowe wzory",
				cta: "PRZEGLĄDAJ WZORY",
				href: "/sklep/gotowe-wzory",
				imageUrl: "/images/categories/gotowe-wzory-personel.webp",
			},
			{
				title: "Tablice z logo",
				cta: "Uzyskaj wycenę",
				href: "/sklep/logo-3d",
				imageUrl: "/images/categories/logo-kategoria-nail-boss.webp",
			},
			{
				title: "Certyfikaty",
				cta: "Zobacz certyfikaty",
				href: "/sklep/certyfikaty",
				imageUrl: "/images/categories/certyfikat-kategoria.png",
			},
		],
	},
};

export const DEFAULT_GLOBAL_CONTENT: GlobalContent = {
	salonLogos: [
		{ id: "fallback-1", name: "Sabrija Store", logoUrl: "/images/logos/sabrija-store.png", order: 0 },
		{ id: "fallback-2", name: "Salon Mia", order: 1 },
		{ id: "fallback-3", name: "Beauty Lab", order: 2 },
	],
};
