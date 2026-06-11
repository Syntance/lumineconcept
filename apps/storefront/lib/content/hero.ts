import type { HeroPortalContentConfig } from "@/components/home/hero-portal-config";
import type { HeroContent } from "./types";
import { HOME_HERO_DEFAULT, LOGO_HERO_DEFAULT } from "./defaults";
import { resolveCmsAssetUrl } from "./asset-url";

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
	desktopImageUrl?: string;
	mobileImageUrl?: string;
} {
	const resolved = hero ?? HOME_HERO_DEFAULT;
	const desktopImageUrl = resolveCmsAssetUrl(resolved.desktopImageUrl?.trim());
	const mobileImageUrl =
		resolveCmsAssetUrl(resolved.mobileImageUrl?.trim()) || desktopImageUrl;
	return {
		portal: heroToPortalConfig(resolved),
		...(desktopImageUrl ? { desktopImageUrl } : {}),
		...(mobileImageUrl ? { mobileImageUrl } : {}),
	};
}

/**
 * Zwraca URL-e z CMS bez sondy HTTP (HEAD/GET).
 * Wcześniejszy probe do R2 po deployu często timeoutował i ukrywał hero do revalidacji cache.
 */
export async function resolveHomeHeroWithFallback(hero?: HeroContent): Promise<{
	portal: HeroPortalContentConfig;
	desktopImageUrl?: string;
	mobileImageUrl?: string;
}> {
	return resolveHomeHero(hero);
}

export function resolveLogoHero(hero?: HeroContent): {
	portal: HeroPortalContentConfig;
	desktopImageUrl?: string;
	mobileImageUrl?: string;
} {
	const resolved: HeroContent = { ...LOGO_HERO_DEFAULT, ...hero };
	const desktopImageUrl = resolveCmsAssetUrl(resolved.desktopImageUrl?.trim());
	const mobileImageUrl =
		resolveCmsAssetUrl(resolved.mobileImageUrl?.trim()) || desktopImageUrl;

	return {
		portal: heroToPortalConfig(resolved),
		...(desktopImageUrl ? { desktopImageUrl } : {}),
		...(mobileImageUrl ? { mobileImageUrl } : {}),
	};
}

/** Zwraca URL-e z CMS bez sondy HTTP — patrz `resolveHomeHeroWithFallback`. */
export async function resolveLogoHeroWithFallback(hero?: HeroContent): Promise<{
	portal: HeroPortalContentConfig;
	desktopImageUrl?: string;
	mobileImageUrl?: string;
}> {
	return resolveLogoHero(hero);
}

export function isLocalPublicImage(url: string): boolean {
	return url.startsWith("/images/") || url.startsWith("/icons/");
}
