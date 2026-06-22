import type { HeroPrefetchBundles } from "@/lib/content/hero-prefetch";

const DESKTOP_MEDIA = "(min-width: 1024px)";
const MOBILE_MEDIA = "(max-width: 1023px)";

function uniqueUrls(urls: string[]): string[] {
	return [...new Set(urls.filter(Boolean))];
}

type HeroCriticalImagePrefetchProps = {
	bundles: HeroPrefetchBundles;
};

/**
 * Preload hero HP + tablice na każdej stronie sklepu — przy soft-nav obraz jest już w cache.
 * `media` chroni mobile LCP przed ultrawide desktop.
 */
export function HeroCriticalImagePrefetch({ bundles }: HeroCriticalImagePrefetchProps) {
	const desktopUrls = uniqueUrls([
		...bundles.home.desktop,
		...bundles.logo3d.desktop,
	]);
	const mobileUrls = uniqueUrls([
		...bundles.home.mobile,
		...bundles.logo3d.mobile,
	]);

	return (
		<>
			{desktopUrls.map((href) => (
				<link
					key={`hero-desktop-${href}`}
					rel="preload"
					as="image"
					href={href}
					fetchPriority="high"
					media={DESKTOP_MEDIA}
				/>
			))}
			{mobileUrls.map((href) => (
				<link
					key={`hero-mobile-${href}`}
					rel="preload"
					as="image"
					href={href}
					fetchPriority="high"
					media={MOBILE_MEDIA}
				/>
			))}
		</>
	);
}
