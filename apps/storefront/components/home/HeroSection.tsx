import Image from "next/image";

import type { HeroContent } from "@/lib/content/types";
import { resolveHomeHeroWithFallback } from "@/lib/content/hero";
import { HeroPortalContent } from "./HeroPortalContent";
import { HeroPortalMobile } from "./HeroPortalMobile";
import { MobileHeroImageBand } from "./MobileHeroImageBand";
import { MobileHeroViewport } from "./MobileHeroViewport";

const HERO_BG_WIDTH = 2560;
const HERO_BG_HEIGHT = 966;

/**
 * Hero — desktop: ultrawide + overlay; mobile: zdjęcie + CTA w 80svh.
 *
 * Tło pochodzi z CMS. Na produkcji `prebuild` (sync-cms-to-static) ściąga
 * obraz do `/public/images/cms/…`, więc serwujemy go jako statyczny plik
 * (`unoptimized`) — instant z edge CDN, bez cold-startu optymalizatora.
 * Gdy CMS nie ma obrazu, `resolveHomeHero` daje lokalny fallback (z blur).
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

			<div className="relative hidden w-full overflow-hidden lg:block lg:aspect-[2560/966] lg:max-h-[966px]">
				{/*
				 * Desktopowe tło hero to element LCP. `eager` + `fetchPriority="high"`
				 * zamiast `lazy` — element LCP nie może być leniwie ładowany (flaga
				 * Lighthouse). Świadomie NIE używamy `priority`: dodałby bezwarunkowy
				 * `<link rel=preload>`, który na mobile (gdzie ten obraz jest `hidden`)
				 * ściągałby ultraszerokie tło z wysokim priorytetem, konkurując z LCP
				 * wersji mobilnej.
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
						unoptimized
						placeholder={desktopBlurDataURL ? "blur" : "empty"}
						blurDataURL={desktopBlurDataURL}
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
