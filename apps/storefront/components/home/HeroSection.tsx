import Image from "next/image";

import type { HeroContent } from "@/lib/content/types";
import { resolveHomeHero } from "@/lib/content/hero";
import { HeroPortalContent } from "./HeroPortalContent";
import { HeroPortalMobile } from "./HeroPortalMobile";

/** Wymiary pliku `public/images/hero-main-wall.webp` — przy podmianie grafiki zaktualizuj. */
const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/** Mobile crop 4:5 — 750×937 px, ~35 KB (public/, bez next/image — stabilny LCP). */
const HERO_MOBILE_WIDTH = 750;
const HERO_MOBILE_HEIGHT = 937;

/**
 * Hero — desktop: ultrawide + overlay; mobile: kompakt (bez pełnego ekranu).
 */
export function HeroSection({
	hero,
	children,
}: {
	hero?: HeroContent;
	children?: React.ReactNode;
}) {
	const { portal, desktopImageUrl, mobileImageUrl } = resolveHomeHero(hero);

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			{/* Mobile — zdjęcie nad copy (niższy kadr niż 4:5) */}
			<div className="flex flex-col lg:hidden">
				<div className="relative h-96 w-full overflow-hidden sm:h-[26rem]">
					<Image
						src={mobileImageUrl}
						alt=""
						width={HERO_MOBILE_WIDTH}
						height={HERO_MOBILE_HEIGHT}
						priority
						fetchPriority="high"
						sizes="100vw"
						unoptimized={mobileImageUrl.startsWith("/")}
						className="absolute inset-0 h-full w-full select-none object-cover object-[63%_26%]"
					/>
				</div>
				<HeroPortalMobile content={portal} />
			</div>

			{/* Desktop — portal + overlay */}
			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				<Image
					src={desktopImageUrl}
					alt=""
					width={HERO_BG_WIDTH}
					height={HERO_BG_HEIGHT}
					loading="lazy"
					fetchPriority="low"
					sizes="100vw"
					className="absolute inset-0 h-full w-full select-none object-cover object-[38%_center]"
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
