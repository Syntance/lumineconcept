import type { HeroContent } from "@/lib/content/types";
import {
	MOBILE_HERO_BAND_WIDTH,
	MOBILE_HERO_BAND_HEIGHT,
	toHeroAvifSrc,
} from "@/lib/content/cms-hero-image";
import { resolveHomeHeroWithFallback } from "@/lib/content/hero";
import { HeroPortalContent } from "./HeroPortalContent";

/**
 * Hero — art-directed single <picture> z media queries.
 *
 * Desktop (≥1024px) i mobile (<1024px) pobierają TYLKO swoje zdjęcie (separate AVIF):
 * – Desktop: ultrawide (2560×966, obiekt top) z desktopImageUrl
 * – Mobile: portrait (1080×1350, obiekt center 58%) z mobileImageUrl
 *
 * <picture><source media="..."> + <img fallback> ensures browser fetches one file per viewport.
 * Preload AVIF z media query w <head> redukuje TTFB delay.
 */
export async function HeroSection({
	hero,
	children,
}: {
	hero?: HeroContent;
	children?: React.ReactNode;
}) {
	const {
		portal,
		desktopImageUrl,
		mobileImageUrl,
		desktopBlurDataURL,
		mobileBlurDataURL,
	} = await resolveHomeHeroWithFallback(hero);

	const mobileDisplayUrl = mobileImageUrl ?? desktopImageUrl;
	const mobileBlur = mobileBlurDataURL ?? desktopBlurDataURL;

	const mobileAvifSrc = mobileDisplayUrl ? toHeroAvifSrc(mobileDisplayUrl) : null;
	const desktopAvifSrc = desktopImageUrl ? toHeroAvifSrc(desktopImageUrl) : null;

	// Determine which image to display
	const displayImageUrl = desktopImageUrl || mobileDisplayUrl;

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			{mobileAvifSrc && (
				<link
					rel="preload"
					href={mobileAvifSrc}
					as="image"
					type="image/avif"
					fetchPriority="high"
					media="(max-width: 1023px)"
				/>
			)}
			{desktopAvifSrc && (
				<link
					rel="preload"
					href={desktopAvifSrc}
					as="image"
					type="image/avif"
					fetchPriority="high"
					media="(min-width: 1024px)"
				/>
			)}

			<div
				className="relative w-full overflow-hidden lg:aspect-[2560/966] lg:max-h-[966px]"
				style={{
					backgroundImage: `url(${mobileBlur})`,
					backgroundSize: "cover",
					backgroundPosition: "center 58%",
				}}
			>
				{displayImageUrl ? (
					<picture>
						{/* Desktop AVIF */}
						{desktopAvifSrc && (
							<source
								media="(min-width: 1024px)"
								type="image/avif"
								srcSet={desktopAvifSrc}
							/>
						)}
						{/* Desktop WebP fallback */}
						{desktopImageUrl && (
							<source media="(min-width: 1024px)" srcSet={desktopImageUrl} />
						)}
						{/* Mobile AVIF */}
						{mobileAvifSrc && (
							<source type="image/avif" srcSet={mobileAvifSrc} />
						)}
						<img
							src={mobileDisplayUrl}
							alt=""
							width={MOBILE_HERO_BAND_WIDTH}
							height={MOBILE_HERO_BAND_HEIGHT}
							loading="eager"
							fetchPriority="high"
							decoding="auto"
							className="absolute inset-0 h-full w-full select-none object-cover object-[center_58%] lg:object-top"
							style={{ color: "transparent" }}
						/>
					</picture>
				) : (
					<div className="absolute inset-0 bg-brand-800" aria-hidden />
				)}

				<HeroPortalContent content={portal} />
			</div>

			{children && (
				<div className="relative z-20 w-full shrink-0">{children}</div>
			)}
		</section>
	);
}
