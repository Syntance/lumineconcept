import type {
	CategoryTile,
	FaqItem,
	GlobalContent,
	HeroContent,
	SalonLogo,
	SiteSettings,
	SocialLinks,
	Testimonial,
	TrustBar,
} from "./types";
import { normalizeFacebookUrl } from "@/lib/social-links";
import { DEFAULT_SITE_SETTINGS } from "./defaults";

const DEFAULT_IG_ALT = "Lumine Concept na Instagramie";

export type TrustBarDisplay = {
	followers: string;
	realizations: string;
	shippingLabel: string;
};

export type AnnouncementBarDisplay = {
	text: string;
	link?: string;
} | null;

export type ShopCategoryCard = {
	title: string;
	cta: string;
	href: string;
	image: string;
};

const DEFAULT_TRUST: TrustBarDisplay = {
	followers: DEFAULT_SITE_SETTINGS.trustBar?.followers ?? "25 000+",
	realizations: DEFAULT_SITE_SETTINGS.trustBar?.realizations ?? "6 000+",
	shippingLabel: DEFAULT_SITE_SETTINGS.trustBar?.shippingLabel ?? "Realizacja ok. 10 dni rob.",
};

export function resolveAnnouncementBar(settings: SiteSettings | null | undefined): AnnouncementBarDisplay {
	const bar = settings?.announcementBar;
	if (!bar?.enabled || !bar.text.trim()) return null;
	return {
		text: bar.text.trim(),
		link: bar.link?.trim() || undefined,
	};
}

export function resolveTrustBarDisplay(trustBar: TrustBar | null | undefined): TrustBarDisplay {
	return {
		followers: trustBar?.followers?.trim() || DEFAULT_TRUST.followers,
		realizations: trustBar?.realizations?.trim() || DEFAULT_TRUST.realizations,
		shippingLabel: trustBar?.shippingLabel?.trim() || DEFAULT_TRUST.shippingLabel,
	};
}

export function resolveFooterText(settings: SiteSettings | null | undefined): string {
	return (
		settings?.footerText?.trim() ||
		`© ${new Date().getFullYear()} ${settings?.title?.trim() || DEFAULT_SITE_SETTINGS.title}. Wszelkie prawa zastrzeżone.`
	);
}

export function resolveSocialLinks(settings: SiteSettings | null | undefined): SocialLinks {
	const defaultFacebook = DEFAULT_SITE_SETTINGS.socialLinks?.facebook;
	const rawFacebook =
		settings?.socialLinks?.facebook?.trim() || defaultFacebook || "";

	return {
		instagram: settings?.socialLinks?.instagram?.trim() || DEFAULT_SITE_SETTINGS.socialLinks?.instagram,
		facebook: normalizeFacebookUrl(rawFacebook, defaultFacebook),
		tiktok: settings?.socialLinks?.tiktok?.trim(),
	};
}

export function resolveInstagramProfileUrl(social: SocialLinks): string {
	return social.instagram?.trim() || DEFAULT_SITE_SETTINGS.socialLinks?.instagram || "";
}

export function mapShopCategoryTiles(
	tiles: CategoryTile[] | undefined,
	fallback: readonly ShopCategoryCard[],
): ShopCategoryCard[] {
	if (!tiles?.length) return [...fallback];
	return tiles.map((t) => ({
		title: t.title,
		cta: t.cta,
		href: t.href,
		image: t.imageUrl,
	}));
}

export function pickTestimonials(testimonials: Testimonial[] | undefined, limit: number): Testimonial[] {
	return (testimonials ?? []).slice(0, limit);
}

export function pickPageFaq(faq: FaqItem[] | undefined): FaqItem[] {
	return [...(faq ?? [])].sort((a, b) => a.order - b.order);
}

export type SalonMarqueeEntry =
	| { type: "text"; name: string }
	| { type: "logo"; name: string; src: string };

export function mapSalonLogosForMarquee(global: GlobalContent | null | undefined): SalonMarqueeEntry[] {
	const logos = global?.salonLogos ?? [];
	if (!logos.length) return [];
	return logos.map((logo: SalonLogo) =>
		logo.logoUrl
			? { type: "logo" as const, name: logo.alt?.trim() || logo.name, src: logo.logoUrl }
			: { type: "text" as const, name: logo.name },
	);
}

export function resolveInstagramTiles(global: GlobalContent) {
	const rows = global.instagramTiles;
	if (!rows?.length) return [];
	return rows.slice(0, 6).map((row) => ({
		id: row.id,
		permalink: row.postUrl,
		imageUrl: row.imageUrl,
		alt: row.alt?.trim() || DEFAULT_IG_ALT,
	}));
}

export const CMS_STOREFRONT_WIRING = {
	global: {
		announcementBar: "components/layout/AnnouncementBar.tsx",
		trustBar: "HomeTrustMarquee + listing pages",
		checkoutCallout: "ProductPageLayout",
		socialLinks: "Footer, FooterCTA, kontakt, JSON-LD, ProductReviews",
		footerText: "Footer",
		salonLogos: "HomeTrustMarquee",
		instagramTiles: "FooterCTA",
	},
	pages: {
		home: { hero: "HeroSection", brandingCta: "FooterCTA" },
		shop: { categoryTiles: "sklep/page.tsx", testimonials: "sklep/page.tsx" },
		"logo-3d": { hero: "LogoCategoryHeroSection", gallery: "LogoBoardRealizations" },
		"gotowe-wzory": { testimonials: "gotowe-wzory/page.tsx", faq: "PageFaqSection" },
		certyfikaty: { testimonials: "certyfikaty/page.tsx", faq: "PageFaqSection" },
	},
} as const;
