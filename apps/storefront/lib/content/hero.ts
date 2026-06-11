import type { HeroPortalContentConfig } from "@/components/home/hero-portal-config";
import type { HeroContent } from "./types";
import { HOME_HERO_DEFAULT, LOGO_HERO_DEFAULT } from "./defaults";

export function heroToPortalConfig(hero: HeroContent): HeroPortalContentConfig {
	return {
		headline: hero.headline,
		subtitle: hero.subtitle,
		description: hero.description,
		ctaLabel: hero.ctaLabel,
		ctaHref: hero.ctaHref,
		ctaAriaLabel: hero.ctaAriaLabel,
		headlineUppercase: hero.headlineUppercase,
	};
}

export function resolveHomeHero(hero?: HeroContent): {
	portal: HeroPortalContentConfig;
	desktopImageUrl: string;
	mobileImageUrl: string;
} {
	const resolved = hero ?? HOME_HERO_DEFAULT;
	return {
		portal: heroToPortalConfig(resolved),
		desktopImageUrl: resolved.desktopImageUrl ?? HOME_HERO_DEFAULT.desktopImageUrl!,
		mobileImageUrl: resolved.mobileImageUrl ?? HOME_HERO_DEFAULT.mobileImageUrl!,
	};
}

export function resolveLogoHero(hero?: HeroContent): {
	portal: HeroPortalContentConfig;
	desktopImageUrl: string;
	mobileImageUrl: string;
} {
	const resolved: HeroContent = { ...LOGO_HERO_DEFAULT, ...hero };
	const desktopImageUrl =
		resolved.desktopImageUrl?.trim() ||
		LOGO_HERO_DEFAULT.desktopImageUrl ||
		"/images/categories/logo-hero-bg.png";
	const mobileImageUrl = resolved.mobileImageUrl?.trim() || desktopImageUrl;

	return {
		portal: heroToPortalConfig(resolved),
		desktopImageUrl,
		mobileImageUrl,
	};
}
