import Image from "next/image";

import { Breadcrumbs, BREADCRUMBS_ALIGN_CLASS } from "@/components/common/Breadcrumbs";
import { HeroPortalDesktop } from "@/components/home/HeroPortalDesktop";
import { HeroPortalMobile } from "@/components/home/HeroPortalMobile";
import { MobileHeroImageBand } from "@/components/home/MobileHeroImageBand";
import { MobileHeroViewport } from "@/components/home/MobileHeroViewport";
import type { HeroContent } from "@/lib/content/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { resolveLogoHeroWithFallback } from "@/lib/content/hero";
import { cn } from "@/lib/utils";

/** Wymiary desktop — mobile używa wspólnego MobileHeroImageBand (1024×384). */
const LOGO_HERO_BG_WIDTH = 1024;
const LOGO_HERO_BG_HEIGHT = 384;

/**
 * Hero kategorii „Tablice z logo” — mobile: zdjęcie + CTA w 80svh.
 */
export async function LogoCategoryHeroSection({ hero }: { hero?: HeroContent }) {
	const { portal, desktopImageUrl, mobileImageUrl } = await resolveLogoHeroWithFallback(hero);

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			<div className="lg:hidden">
				<MobileHeroViewport
					image={<MobileHeroImageBand src={mobileImageUrl} />}
					portal={<HeroPortalMobile content={portal} />}
					imageOverlay={
						<div className={cn("absolute inset-x-0 top-0 z-20 pt-5", BREADCRUMBS_ALIGN_CLASS)}>
							<Breadcrumbs
								className="mb-0 text-sm [&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white"
								items={[
									{ label: "Strona główna", href: "/" },
									{ label: "Sklep", href: "/sklep" },
									{ label: "Tablice z logo" },
								]}
							/>
						</div>
					}
				/>
			</div>

			{/* Desktop */}
			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				{desktopImageUrl ? (
					<Image
						src={desktopImageUrl}
						alt=""
						width={LOGO_HERO_BG_WIDTH}
						height={LOGO_HERO_BG_HEIGHT}
						priority
						fetchPriority="high"
						sizes="100vw"
						unoptimized={isCmsImageUnoptimized(desktopImageUrl)}
						className="absolute inset-0 h-full w-full select-none object-cover object-[48%_58%]"
					/>
				) : (
					<div className="absolute inset-0 bg-brand-800" aria-hidden />
				)}

				<div
					className="pointer-events-none absolute inset-0 bg-black/35"
					aria-hidden
				/>

				<div className={cn("absolute inset-x-0 top-0 z-20 pt-6", BREADCRUMBS_ALIGN_CLASS)}>
					<Breadcrumbs
						className="mb-0 text-sm [&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white"
						items={[
							{ label: "Strona główna", href: "/" },
							{ label: "Sklep", href: "/sklep" },
							{ label: "Tablice z logo" },
						]}
					/>
				</div>

				<HeroPortalDesktop align="center" content={portal} portalSize="home" />
			</div>
		</section>
	);
}
