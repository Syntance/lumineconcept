import Image from "next/image";

import type { HeroContent } from "@/lib/content/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { resolveHomeHeroWithFallback } from "@/lib/content/hero";
import { HeroImagePreload } from "./HeroImagePreload";
import { HeroPortalContent } from "./HeroPortalContent";
import { HeroPortalMobile } from "./HeroPortalMobile";
import { MobileHeroImageBand } from "./MobileHeroImageBand";
import { MobileHeroViewport } from "./MobileHeroViewport";

const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/**
 * Hero — desktop: ultrawide + overlay; mobile: zdjęcie + CTA w 80svh.
 *
 * Tło z CMS. Mobile: Next.js Image Optimization (srcset, AVIF/WebP, max ~1536px po sync).
 * Desktop: pełna szerokość; po deployu prebuild (`sync-cms-to-static`) kopiuje obraz źródłowy do
 * `/public/images/cms/…` — Next.js go optymalizuje w locie.
 * Bez obrazu w CMS: placeholder (brand-800), bez fallbacku z repo.
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
	} = await resolveHomeHeroWithFallback(hero);

	const mobileDisplayUrl = mobileImageUrl ?? desktopImageUrl;

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			<HeroImagePreload desktopUrl={desktopImageUrl} mobileUrl={mobileDisplayUrl} />
			<div className="lg:hidden">
				<MobileHeroViewport
					image={
						mobileDisplayUrl ? (
							<MobileHeroImageBand
								src={mobileDisplayUrl}
								objectPositionClass="object-[center_58%]"
							/>
						) : (
							<div className="absolute inset-0 bg-brand-800" aria-hidden />
						)
					}
					portal={<HeroPortalMobile content={portal} />}
				/>
			</div>

			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				{/*
				 * Desktop LCP — eager + fetchPriority; prefetch w HeroImageCacheWarmer (layout sklepu).
				 */}
				{desktopImageUrl ? (
					<Image
						src={desktopImageUrl}
						alt=""
						width={HERO_BG_WIDTH}
						height={HERO_BG_HEIGHT}
						loading="eager"
						fetchPriority="high"
						sizes="100vw"
						unoptimized={isCmsImageUnoptimized(desktopImageUrl)}
						className="absolute inset-0 h-full w-full select-none object-cover object-top"
					/>
				) : (
					<div className="absolute inset-0 bg-brand-800" aria-hidden />
				)}

				<div
					className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/45 via-black/15 to-transparent"
					aria-hidden
				/>

				<HeroPortalContent content={portal} />
			</div>

			{children && (
				<div className="relative z-20 w-full shrink-0">{children}</div>
			)}
		</section>
	);
}
