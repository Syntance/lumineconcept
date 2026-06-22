import type { HeroPortalContentConfig } from "@/components/home/hero-portal-config";
import { normalizeHeroCtaHref } from "./cta-href";
import type { HeroContent } from "./types";
import { HOME_HERO_DEFAULT, LOGO_HERO_DEFAULT } from "./defaults";
import { resolveCmsAssetUrl } from "./asset-url";
import { STATIC_CMS_CONTENT } from "./static-cms-content";

type StaticHeroImages = { desktopImageUrl?: string; mobileImageUrl?: string };

/** Ścieżki z ostatniego buildu — zawsze lokalne `/images/cms/…`. Gwarancja działania gdy CMS niedostępny. */
function getStaticHeroImages(pageKey: "home" | "logo-3d"): StaticHeroImages {
	try {
		const pages = (STATIC_CMS_CONTENT as Record<string, unknown>)?.["magazyn_page_content"] as
			| Record<string, unknown>
			| undefined;
		const hero = pages?.[pageKey === "logo-3d" ? "logo-3d" : "home"] as
			| Record<string, unknown>
			| undefined;
		const h = (hero?.["hero"] ?? hero) as Record<string, string> | undefined;
		return {
			desktopImageUrl: typeof h?.desktopImageUrl === "string" ? h.desktopImageUrl : undefined,
			mobileImageUrl: typeof h?.mobileImageUrl === "string" ? h.mobileImageUrl : undefined,
		};
	} catch {
		return {};
	}
}

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
	const staticFallback = getStaticHeroImages("home");

	const desktopImageUrl =
		resolveCmsAssetUrl(resolved.desktopImageUrl?.trim()) ??
		resolveCmsAssetUrl(staticFallback.desktopImageUrl);
	const mobileImageUrl =
		resolveCmsAssetUrl(resolved.mobileImageUrl?.trim()) ??
		desktopImageUrl ??
		resolveCmsAssetUrl(staticFallback.mobileImageUrl);

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
	const staticFallback = getStaticHeroImages("logo-3d");

	const desktopImageUrl =
		resolveCmsAssetUrl(resolved.desktopImageUrl?.trim()) ??
		resolveCmsAssetUrl(staticFallback.desktopImageUrl);
	const mobileImageUrl =
		resolveCmsAssetUrl(resolved.mobileImageUrl?.trim()) ??
		desktopImageUrl ??
		resolveCmsAssetUrl(staticFallback.mobileImageUrl);

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
