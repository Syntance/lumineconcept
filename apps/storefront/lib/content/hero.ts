import type { HeroPortalContentConfig } from "@/components/home/hero-portal-config";
import { normalizeHeroCtaHref } from "./cta-href";
import type { HeroContent } from "./types";
import { HOME_HERO_DEFAULT, LOGO_HERO_DEFAULT } from "./defaults";
import { resolveCmsAssetUrl } from "./asset-url";

export function heroToPortalConfig(hero: HeroContent): HeroPortalContentConfig {
	return {
		headline: hero.headline,
		subtitle: hero.subtitle,
		description: hero.description,
		ctaLabel: hero.ctaLabel,
		ctaHref: normalizeHeroCtaHref(hero.ctaHref),
		ctaAriaLabel: hero.ctaAriaLabel,
		headlineUppercase: hero.headlineUppercase,
		ctaShowDownArrow: hero.ctaShowDownArrow,
	};
}

export function resolveHomeHero(hero?: HeroContent): {
	portal: HeroPortalContentConfig;
	desktopImageUrl?: string;
	mobileImageUrl?: string;
	desktopBlurDataURL?: string;
	mobileBlurDataURL?: string;
} {
	const resolved = hero ?? HOME_HERO_DEFAULT;
	const desktopImageUrl = resolveCmsAssetUrl(resolved.desktopImageUrl?.trim());
	const mobileImageUrl =
		resolveCmsAssetUrl(resolved.mobileImageUrl?.trim()) || desktopImageUrl;
	
	// Debug: loguj finalne URL-e
	if (resolved.desktopImageUrl && !desktopImageUrl) {
		console.error("[Hero] Nie udało się zresolvować desktopImageUrl:", resolved.desktopImageUrl);
	}
	if (resolved.mobileImageUrl && !mobileImageUrl) {
		console.error("[Hero] Nie udało się zresolvować mobileImageUrl:", resolved.mobileImageUrl);
	}
	
	return {
		portal: heroToPortalConfig(resolved),
		...(desktopImageUrl ? { desktopImageUrl } : {}),
		...(mobileImageUrl ? { mobileImageUrl } : {}),
		...(resolved.desktopBlurDataURL ? { desktopBlurDataURL: resolved.desktopBlurDataURL } : {}),
		...(resolved.mobileBlurDataURL ? { mobileBlurDataURL: resolved.mobileBlurDataURL } : {}),
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
	desktopBlurDataURL?: string;
	mobileBlurDataURL?: string;
}> {
	return resolveHomeHero(hero);
}

export function resolveLogoHero(hero?: HeroContent): {
	portal: HeroPortalContentConfig;
	desktopImageUrl?: string;
	mobileImageUrl?: string;
	desktopBlurDataURL?: string;
	mobileBlurDataURL?: string;
} {
	const resolved: HeroContent = { ...LOGO_HERO_DEFAULT, ...hero };
	const desktopImageUrl = resolveCmsAssetUrl(resolved.desktopImageUrl?.trim());
	const mobileImageUrl =
		resolveCmsAssetUrl(resolved.mobileImageUrl?.trim()) || desktopImageUrl;

	return {
		portal: heroToPortalConfig(resolved),
		...(desktopImageUrl ? { desktopImageUrl } : {}),
		...(mobileImageUrl ? { mobileImageUrl } : {}),
		...(resolved.desktopBlurDataURL ? { desktopBlurDataURL: resolved.desktopBlurDataURL } : {}),
		...(resolved.mobileBlurDataURL ? { mobileBlurDataURL: resolved.mobileBlurDataURL } : {}),
	};
}

/** Zwraca URL-e z CMS bez sondy HTTP — patrz `resolveHomeHeroWithFallback`. */
export async function resolveLogoHeroWithFallback(hero?: HeroContent): Promise<{
	portal: HeroPortalContentConfig;
	desktopImageUrl?: string;
	mobileImageUrl?: string;
	desktopBlurDataURL?: string;
	mobileBlurDataURL?: string;
}> {
	return resolveLogoHero(hero);
}

export function isLocalPublicImage(url: string): boolean {
	return url.startsWith("/images/") || url.startsWith("/icons/");
}
