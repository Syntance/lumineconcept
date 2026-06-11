import Image from "next/image";

import { Breadcrumbs, BREADCRUMBS_ALIGN_CLASS } from "@/components/common/Breadcrumbs";
import { HeroPortalDesktop } from "@/components/home/HeroPortalDesktop";
import { HeroPortalMobile } from "@/components/home/HeroPortalMobile";
import { LOGO_HERO_PORTAL } from "@/components/home/hero-portal-config";
import { cn } from "@/lib/utils";

/** Wymiary `public/images/categories/logo-hero-bg.png` — przy podmianie grafiki zaktualizuj. */
const LOGO_HERO_BG_WIDTH = 1024;
const LOGO_HERO_BG_HEIGHT = 384;

/** Mobile: ultrawide PNG w niskim kontenerze — crop 4:5 ucina okrągłą tablicę. */
const LOGO_HERO_DESKTOP_SRC = "/images/categories/logo-hero-bg.png?v=4";

/**
 * Hero kategorii „Tablice z logo” — desktop: portal; mobile: niski kadr + brązowy blok (jak HP).
 */
export function LogoCategoryHeroSection() {
	return (
		<section className="relative flex w-full flex-col overflow-x-hidden">
			{/* Mobile */}
			<div className="flex flex-col lg:hidden">
				<div className="relative h-44 w-full overflow-hidden sm:h-52">
					<Image
						src={LOGO_HERO_DESKTOP_SRC}
						alt=""
						width={LOGO_HERO_BG_WIDTH}
						height={LOGO_HERO_BG_HEIGHT}
						priority
						fetchPriority="high"
						sizes="100vw"
						unoptimized
						className="absolute inset-0 h-full w-full select-none object-cover object-[48%_58%]"
					/>
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
				<HeroPortalMobile content={LOGO_HERO_PORTAL} />
			</div>

			{/* Desktop */}
			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				<Image
					src={LOGO_HERO_DESKTOP_SRC}
					alt=""
					width={LOGO_HERO_BG_WIDTH}
					height={LOGO_HERO_BG_HEIGHT}
					priority
					fetchPriority="high"
					sizes="100vw"
					className="absolute inset-0 h-full w-full select-none object-cover object-[48%_58%]"
				/>

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

				<HeroPortalDesktop align="center" content={LOGO_HERO_PORTAL} portalSize="home" />
			</div>
		</section>
	);
}
