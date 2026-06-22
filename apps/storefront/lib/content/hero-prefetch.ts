import "server-only";

import { cache } from "react";

import { resolveHomeHero, resolveLogoHero } from "./hero";
import { getPageContent } from "./index";

export type HeroPrefetchBundles = {
	home: { desktop: string[]; mobile: string[] };
	logo3d: { desktop: string[]; mobile: string[] };
};

function collectHeroUrls(
	desktopImageUrl?: string,
	mobileImageUrl?: string,
): { desktop: string[]; mobile: string[] } {
	const desktop = desktopImageUrl ? [desktopImageUrl] : [];
	const mobileSet = new Set<string>();
	if (mobileImageUrl) mobileSet.add(mobileImageUrl);
	if (desktopImageUrl) mobileSet.add(desktopImageUrl);
	return { desktop, mobile: [...mobileSet] };
}

/** URL-e hero HP + tablice z logo — prefetch w layoutcie (cache przeglądarki przed soft-nav). */
export const getHeroPrefetchBundles = cache(async (): Promise<HeroPrefetchBundles> => {
	const [homePage, logoPage] = await Promise.all([
		getPageContent("home"),
		getPageContent("logo-3d"),
	]);

	const homeHero = resolveHomeHero(homePage.hero);
	const logoHero = resolveLogoHero(logoPage.hero);

	return {
		home: collectHeroUrls(homeHero.desktopImageUrl, homeHero.mobileImageUrl),
		logo3d: collectHeroUrls(logoHero.desktopImageUrl, logoHero.mobileImageUrl),
	};
});
