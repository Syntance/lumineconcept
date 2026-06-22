"use client";

import { useCallback, useEffect } from "react";

const DESKTOP_MQ = "(min-width: 1024px)";

function warmImageCache(urls: string[]): void {
	for (const src of urls) {
		if (!src) continue;
		const probe = new window.Image();
		probe.decoding = "async";
		probe.src = src;
	}
}

type HeroImageCacheWarmerProps = {
	desktopUrls: string[];
	mobileUrls: string[];
};

/**
 * Dogrzewa cache hero po idle — uzupełnia preload z layoutu (szczególnie soft-nav na prod).
 */
export function HeroImageCacheWarmer({
	desktopUrls,
	mobileUrls,
}: HeroImageCacheWarmerProps) {
	const warm = useCallback(() => {
		const urls = window.matchMedia(DESKTOP_MQ).matches ? desktopUrls : mobileUrls;
		warmImageCache(urls);
	}, [desktopUrls, mobileUrls]);

	useEffect(() => {
		if (typeof window.requestIdleCallback === "function") {
			const id = window.requestIdleCallback(warm, { timeout: 1500 });
			return () => window.cancelIdleCallback(id);
		}
		const timer = window.setTimeout(warm, 300);
		return () => window.clearTimeout(timer);
	}, [warm]);

	return null;
}

export function prefetchHeroUrls(desktopUrls: string[], mobileUrls: string[]): void {
	if (typeof window === "undefined") return;
	const urls = window.matchMedia(DESKTOP_MQ).matches ? desktopUrls : mobileUrls;
	warmImageCache(urls);
}
