import Image from "next/image";

import type { HeroContent } from "@/lib/content/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { resolveHomeHeroWithFallback } from "@/lib/content/hero";
import { HeroPortalContent } from "./HeroPortalContent";
import { HeroPortalMobile } from "./HeroPortalMobile";
import { MobileHeroImageBand } from "./MobileHeroImageBand";
import { MobileHeroViewport } from "./MobileHeroViewport";

const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

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
	const { portal, desktopImageUrl, mobileImageUrl } = await resolveHomeHeroWithFallback(hero);
	const mobileDisplayUrl = mobileImageUrl ?? desktopImageUrl;

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			<div className="lg:hidden">
				<MobileHeroViewport
					image={<MobileHeroImageBand src={mobileDisplayUrl} />}
					portal={<HeroPortalMobile content={portal} />}
				/>
			</div>

			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				{desktopImageUrl ? (
					<Image
						src={desktopImageUrl}
						alt=""
						width={HERO_BG_WIDTH}
						height={HERO_BG_HEIGHT}
						priority
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
