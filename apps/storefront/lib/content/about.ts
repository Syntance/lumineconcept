import { ABOUT_PAGE_DEFAULT, ABOUT_HERO_DEFAULT } from "./defaults";
import { normalizeAboutParagraphsForSave } from "./about-text";
import { normalizeHeroCtaHref } from "./cta-href";
import { resolveCmsAssetUrl } from "./asset-url";
import type { AboutPageContent, HeroContent, PageContent } from "./types";

/** Lokalne fallbacki w repo — dopóki CMS nie opublikuje obrazów przez prebuild sync. */
export const ABOUT_STATIC_IMAGES = {
	hero: "/images/about/hero-texture.webp",
	intro: "/images/about/sisters-desk.webp",
	mission: "/images/about/mission-workshop.webp",
	closing: "/images/about/closing-sign.webp",
} as const;

export type ResolvedAboutHero = {
	headline: string;
	subtitle?: string;
	backgroundUrl: string;
	ctaLabel: string;
	ctaHref: string;
};

export type ResolvedAboutSections = {
	sideCaption: string;
	introHeading: string;
	introParagraphs: string[];
	introImageUrl: string;
	introImageAlt: string;
	introLabel: string;
	missionParagraphs: string[];
	missionImageUrl: string;
	missionImageAlt: string;
	missionLabel: string;
	closingParagraphs: string[];
	closingImageUrl: string;
	closingImageAlt: string;
	closingLabel: string;
};

export type ResolvedAboutPage = {
	hero: ResolvedAboutHero;
	sections: ResolvedAboutSections;
};

function resolveImageUrl(cmsUrl: string | undefined, fallback: string): string {
	return resolveCmsAssetUrl(cmsUrl?.trim()) ?? fallback;
}

export function resolveAboutHero(hero?: HeroContent): ResolvedAboutHero {
	const merged: HeroContent = { ...ABOUT_HERO_DEFAULT, ...hero };
	return {
		headline: merged.headline.trim() || ABOUT_HERO_DEFAULT.headline,
		subtitle: merged.subtitle?.trim() || ABOUT_HERO_DEFAULT.subtitle,
		backgroundUrl: resolveImageUrl(merged.desktopImageUrl, ABOUT_STATIC_IMAGES.hero),
		ctaLabel: merged.ctaLabel?.trim() || ABOUT_HERO_DEFAULT.ctaLabel,
		ctaHref: normalizeHeroCtaHref(merged.ctaHref || ABOUT_HERO_DEFAULT.ctaHref),
	};
}

export function resolveAboutSections(about?: AboutPageContent): ResolvedAboutSections {
	const merged: AboutPageContent = { ...ABOUT_PAGE_DEFAULT, ...about };

	return {
		sideCaption: merged.sideCaption?.trim() || ABOUT_PAGE_DEFAULT.sideCaption || "",
		introHeading: merged.introHeading?.trim() || ABOUT_PAGE_DEFAULT.introHeading || "O NAS",
		introParagraphs:
			normalizeAboutParagraphsForSave(
				merged.introParagraphs?.filter((p) => p.trim().length > 0),
			) ?? ABOUT_PAGE_DEFAULT.introParagraphs ?? [],
		introImageUrl: resolveImageUrl(merged.introImageUrl, ABOUT_STATIC_IMAGES.intro),
		introImageAlt: merged.introImageAlt?.trim() || ABOUT_PAGE_DEFAULT.introImageAlt || "",
		introLabel: merged.introLabel?.trim() || ABOUT_PAGE_DEFAULT.introLabel || "",
		missionParagraphs:
			normalizeAboutParagraphsForSave(
				merged.missionParagraphs?.filter((p) => p.trim().length > 0),
			) ?? ABOUT_PAGE_DEFAULT.missionParagraphs ?? [],
		missionImageUrl: resolveImageUrl(merged.missionImageUrl, ABOUT_STATIC_IMAGES.mission),
		missionImageAlt: merged.missionImageAlt?.trim() || ABOUT_PAGE_DEFAULT.missionImageAlt || "",
		missionLabel: merged.missionLabel?.trim() || ABOUT_PAGE_DEFAULT.missionLabel || "",
		closingParagraphs:
			normalizeAboutParagraphsForSave(
				merged.closingParagraphs?.filter((p) => p.trim().length > 0),
			) ?? ABOUT_PAGE_DEFAULT.closingParagraphs ?? [],
		closingImageUrl: resolveImageUrl(merged.closingImageUrl, ABOUT_STATIC_IMAGES.closing),
		closingImageAlt: merged.closingImageAlt?.trim() || ABOUT_PAGE_DEFAULT.closingImageAlt || "",
		closingLabel: merged.closingLabel?.trim() || ABOUT_PAGE_DEFAULT.closingLabel || "",
	};
}

export function resolveAboutPage(content: PageContent): ResolvedAboutPage {
	return {
		hero: resolveAboutHero(content.hero),
		sections: resolveAboutSections(content.about),
	};
}
