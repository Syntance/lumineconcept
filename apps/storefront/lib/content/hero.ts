import type { HeroPortalContentConfig } from "@/components/home/hero-portal-config";
import type { HeroContent } from "./types";
import { HOME_HERO_DEFAULT, LOGO_HERO_DEFAULT } from "./defaults";
import { isStorefrontPublicAssetPath, resolveCmsAssetUrl } from "@/lib/content/asset-url";

const LOGO_HERO_FALLBACK_DESKTOP = LOGO_HERO_DEFAULT.desktopImageUrl ?? "/images/categories/logo-hero-bg.png";

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
		resolveCmsAssetUrl(resolved.desktopImageUrl?.trim()) ||
		LOGO_HERO_FALLBACK_DESKTOP;
	const mobileImageUrl =
		resolveCmsAssetUrl(resolved.mobileImageUrl?.trim()) || desktopImageUrl;

	return {
		portal: heroToPortalConfig(resolved),
		desktopImageUrl,
		mobileImageUrl,
	};
}

async function isHeroImageUrlAccessible(url: string): Promise<boolean> {
	if (url.startsWith("/")) return true;
	try {
		let res = await fetch(url, {
			method: "HEAD",
			signal: AbortSignal.timeout(5_000),
			next: { revalidate: 300 },
		});
		if (res.status === 405) {
			res = await fetch(url, {
				method: "GET",
				headers: { Range: "bytes=0-0" },
				signal: AbortSignal.timeout(5_000),
				next: { revalidate: 300 },
			});
		}
		return res.ok || res.status === 206;
	} catch {
		return false;
	}
}

/** CMS URL + fallback gdy plik z Medusa/R2 zwraca 404 (np. po migracji). */
export async function resolveLogoHeroWithFallback(hero?: HeroContent): Promise<{
	portal: HeroPortalContentConfig;
	desktopImageUrl: string;
	mobileImageUrl: string;
}> {
	const resolved = resolveLogoHero(hero);

	const desktopOk = await isHeroImageUrlAccessible(resolved.desktopImageUrl);
	const desktopImageUrl = desktopOk ? resolved.desktopImageUrl : LOGO_HERO_FALLBACK_DESKTOP;

	const mobileOk = await isHeroImageUrlAccessible(resolved.mobileImageUrl);
	const mobileImageUrl = mobileOk ? resolved.mobileImageUrl : desktopImageUrl;

	return {
		portal: resolved.portal,
		desktopImageUrl,
		mobileImageUrl,
	};
}

export function isLocalPublicImage(url: string): boolean {
	return isStorefrontPublicAssetPath(url);
}
