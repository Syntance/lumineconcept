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

/** CMS URL — bez fallbacku do /public; brak URL = brak tła. */
export async function resolveLogoHeroWithFallback(hero?: HeroContent): Promise<{
	portal: HeroPortalContentConfig;
	desktopImageUrl?: string;
	mobileImageUrl?: string;
}> {
	const resolved = resolveLogoHero(hero);

	if (!resolved.desktopImageUrl) {
		return resolved;
	}

	const desktopOk = await isHeroImageUrlAccessible(resolved.desktopImageUrl);
	if (!desktopOk) {
		return { portal: resolved.portal };
	}

	const mobileUrl = resolved.mobileImageUrl ?? resolved.desktopImageUrl;
	const mobileOk = await isHeroImageUrlAccessible(mobileUrl);

	return {
		portal: resolved.portal,
		desktopImageUrl: resolved.desktopImageUrl,
		...(mobileOk ? { mobileImageUrl: mobileUrl } : { mobileImageUrl: resolved.desktopImageUrl }),
	};
}

export function isLocalPublicImage(url: string): boolean {
	return url.startsWith("/images/") || url.startsWith("/icons/");
}
