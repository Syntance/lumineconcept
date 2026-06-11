import Image from "next/image";

import type { HeroContent } from "@/lib/content/types";
import { resolveHomeHeroWithFallback } from "@/lib/content/hero";
import { HeroPortalContent } from "./HeroPortalContent";
import { HeroPortalMobile } from "./HeroPortalMobile";
import { MobileHeroImageBand } from "./MobileHeroImageBand";
import { MobileHeroViewport } from "./MobileHeroViewport";

// Static imports dla błyskawicznego ładowania (bypass CMS)
import heroMainWallDesktop from "@/public/images/hero-main-wall.webp";
import heroMainWallMobile from "@/public/images/hero-main-wall-mobile.webp";

const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

// HARDCODED hero images — zawsze lokalne, zero delay
const HERO_DESKTOP_SRC = heroMainWallDesktop.src;
const HERO_MOBILE_SRC = heroMainWallMobile.src;
const HERO_DESKTOP_BLUR = heroMainWallDesktop.blurDataURL || "";
const HERO_MOBILE_BLUR = heroMainWallMobile.blurDataURL || "";

/**
 * Hero — desktop: ultrawide + overlay; mobile: zdjęcie + CTA w 80svh.
 */
export async function HeroSection({
	hero,
	children,
}: {
	hero?: HeroContent;
	children?: React.ReactNode;
}) {
	const { portal } = await resolveHomeHeroWithFallback(hero);
	
	// Używamy HARDCODED lokalnych obrazów, ignorujemy CMS URLs
	const desktopImageUrl = HERO_DESKTOP_SRC;
	const mobileDisplayUrl = HERO_MOBILE_SRC;
	const desktopBlurDataURL = HERO_DESKTOP_BLUR;
	const mobileBlur = HERO_MOBILE_BLUR;

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			<div className="lg:hidden">
				<MobileHeroViewport
					image={<MobileHeroImageBand src={mobileDisplayUrl} blurDataURL={mobileBlur} />}
					portal={<HeroPortalMobile content={portal} />}
				/>
			</div>

			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				<Image
					src={desktopImageUrl}
					alt=""
					width={HERO_BG_WIDTH}
					height={HERO_BG_HEIGHT}
					loading="lazy"
					unoptimized
					placeholder="blur"
					blurDataURL={desktopBlurDataURL}
					className="absolute inset-0 h-full w-full select-none object-cover object-top"
				/>

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
