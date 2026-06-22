"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";

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
 * Prefetch hero po stronie klienta — bez `<link>` w RSC (unika hydration mismatch z hoistem do head).
 */
export function HeroImageCacheWarmer({
	desktopUrls,
	mobileUrls,
}: HeroImageCacheWarmerProps) {
	const warm = useCallback(() => {
		const urls = window.matchMedia(DESKTOP_MQ).matches ? desktopUrls : mobileUrls;
		warmImageCache(urls);
	}, [desktopUrls, mobileUrls]);

	useLayoutEffect(() => {
		warm();
	}, [warm]);

	useEffect(() => {
		if (typeof window.requestIdleCallback !== "function") return;
		const id = window.requestIdleCallback(warm, { timeout: 3000 });
		return () => window.cancelIdleCallback(id);
	}, [warm]);

	return null;
}

export function prefetchHeroUrls(desktopUrls: string[], mobileUrls: string[]): void {
	if (typeof window === "undefined") return;
	const urls = window.matchMedia(DESKTOP_MQ).matches ? desktopUrls : mobileUrls;
	warmImageCache(urls);
}
