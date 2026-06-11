import Image from "next/image";

import { Breadcrumbs, BREADCRUMBS_ALIGN_CLASS } from "@/components/common/Breadcrumbs";
import { HeroPortalDesktop } from "@/components/home/HeroPortalDesktop";
import { HeroPortalMobile } from "@/components/home/HeroPortalMobile";
import type { HeroContent } from "@/lib/content/types";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { resolveLogoHeroWithFallback } from "@/lib/content/hero";
import { cn } from "@/lib/utils";

/** Desktop — ten sam kadr co home hero (2560×966). */
const LOGO_HERO_DESKTOP_WIDTH = 2560;
const LOGO_HERO_DESKTOP_HEIGHT = 966;

/** Mobile crop `logo-hero-bg-mobile.webp` — pełna szerokość, naturalna wysokość. */
const LOGO_HERO_MOBILE_WIDTH = 750;
const LOGO_HERO_MOBILE_HEIGHT = 937;

/**
 * Hero kategorii „Tablice z logo”.
 * Mobile: całe zdjęcie na pełną szerokość + brązowy blok CTA pod spodem.
 * Desktop: ultrawide z portalem.
 */
export async function LogoCategoryHeroSection({ hero }: { hero?: HeroContent }) {
	const { portal, desktopImageUrl, mobileImageUrl } = await resolveLogoHeroWithFallback(hero);
	const mobileDisplayUrl = mobileImageUrl ?? desktopImageUrl;

	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			<div className="flex flex-col lg:hidden">
				<div className="relative w-full overflow-hidden">
					{mobileDisplayUrl ? (
						<Image
							src={mobileDisplayUrl}
							alt=""
							width={LOGO_HERO_MOBILE_WIDTH}
							height={LOGO_HERO_MOBILE_HEIGHT}
							priority
							fetchPriority="high"
							sizes="100vw"
							unoptimized={isCmsImageUnoptimized(mobileDisplayUrl)}
							className="block h-auto w-full max-w-none select-none"
						/>
					) : (
						<div className="aspect-[4/5] w-full bg-brand-800" aria-hidden />
					)}
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
				</div>
				<HeroPortalMobile content={portal} />
			</div>

			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				{desktopImageUrl ? (
					<Image
						src={desktopImageUrl}
						alt=""
						width={LOGO_HERO_DESKTOP_WIDTH}
						height={LOGO_HERO_DESKTOP_HEIGHT}
						priority
						fetchPriority="high"
						sizes="100vw"
						unoptimized={isCmsImageUnoptimized(desktopImageUrl)}
						className="absolute inset-0 h-full w-full select-none object-cover object-top"
					/>
				) : (
					<div className="absolute inset-0 bg-brand-800" aria-hidden />
				)}

				<div className="pointer-events-none absolute inset-0 bg-black/35" aria-hidden />

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
