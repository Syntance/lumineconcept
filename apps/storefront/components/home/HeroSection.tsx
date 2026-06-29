import { preload } from "react-dom";
import type { HeroContent } from "@/lib/content/types";
import { BRAND_BLUR_DATA_URL } from "@/lib/images/blur";
import { DESKTOP_HERO_WIDTH, DESKTOP_HERO_HEIGHT, toHeroAvifSrc } from "@/lib/content/cms-hero-image";
import { resolveHomeHeroWithFallback } from "@/lib/content/hero";
import { HeroPortalContent } from "./HeroPortalContent";
import { HeroPortalMobile } from "./HeroPortalMobile";
import { MobileHeroImageBand } from "./MobileHeroImageBand";
import { MobileHeroViewport } from "./MobileHeroViewport";

/**
 * Hero — desktop: ultrawide + portal; mobile: zdjęcie + CTA w 80svh.
 *
 * Obrazy hero serwowane jako statyczne pliki z prebuild (sync-cms-to-static):
 *  – WebP q92 (fallback dla starszych przeglądarek)
 *  – AVIF q70 (ok. 50% mniej bajtów, nowoczesne przeglądarki)
 *
 * Preload AVIF hoistowany do <head> przez React RSC (media query ogranicza do
 * właściwego viewport, żeby mobile nie pobierał desktop AVIF i odwrotnie).
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

	const desktopBlur = desktopBlurDataURL ?? BRAND_BLUR_DATA_URL;

	/*
	 * React 19 preload() API — hoistuje do <head> jako <link rel="preload">.
	 * fetchPriority: "high" jest kluczowe: preload as="image" ma w Chrome
	 * domyślnie LOW priorytet i przegrywa z fontami (HIGH). Bez tego AVIF
	 * startuje z opóźnieniem mimo preloadu. type="image/avif" powoduje, że
	 * przeglądarki bez obsługi AVIF pomijają preload (nie marnują pasma).
	 * media= ogranicza preload do właściwego viewport.
	 */
	if (mobileAvifSrc) {
		preload(mobileAvifSrc, {
			as: "image",
			fetchPriority: "high",
			type: "image/avif",
			media: "(max-width: 1023px)",
		});
	}
	if (desktopAvifSrc) {
		preload(desktopAvifSrc, {
			as: "image",
			fetchPriority: "high",
			type: "image/avif",
			media: "(min-width: 1024px)",
		});
	}

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">

			<div className="lg:hidden">
				<MobileHeroViewport
					image={
						mobileDisplayUrl ? (
							<MobileHeroImageBand
								src={mobileDisplayUrl}
								blurDataURL={mobileBlur}
								objectPositionClass="object-[center_58%]"
							/>
						) : (
							<div className="absolute inset-0 bg-brand-800" aria-hidden />
						)
					}
					portal={<HeroPortalMobile content={portal} />}
				/>
			</div>

			<div
				className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]"
				style={{
					backgroundImage: `url(${desktopBlur})`,
					backgroundSize: "cover",
				}}
			>
				{desktopImageUrl ? (
					<picture>
						{desktopAvifSrc && <source type="image/avif" srcSet={desktopAvifSrc} />}
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={desktopImageUrl}
							alt=""
							width={DESKTOP_HERO_WIDTH}
							height={DESKTOP_HERO_HEIGHT}
					loading="eager"
						fetchPriority="high"
						decoding="auto"
							className="absolute inset-0 h-full w-full select-none object-cover object-top"
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
