import Image from "next/image";
import { BRAND_BLUR_DATA_URL } from "@/lib/images/blur";
import {
	MOBILE_HERO_BAND_HEIGHT,
	MOBILE_HERO_BAND_WIDTH,
} from "@/lib/content/cms-hero-image";

export { MOBILE_HERO_BAND_HEIGHT, MOBILE_HERO_BAND_WIDTH };

type MobileHeroImageBandProps = {
	src: string;
	priority?: boolean;
	/** Blur placeholder — gdy brak (np. obraz z CMS), pomijamy. */
	blurDataURL?: string;
	/** Kadrowanie w pionie — domyślnie wyśrodkowane. */
	objectPositionClass?: string;
};

/** Zdjęcie wypełnia obszar flex-1 rodzica — object-cover. */
export function MobileHeroImageBand({
	src,
	priority = true,
	blurDataURL,
	objectPositionClass = "object-center",
}: MobileHeroImageBandProps) {
	return (
		<div className="relative h-full w-full overflow-hidden">
			<Image
				src={src}
				alt=""
				width={MOBILE_HERO_BAND_WIDTH}
				height={MOBILE_HERO_BAND_HEIGHT}
				loading={priority ? "eager" : "lazy"}
				fetchPriority={priority ? "high" : undefined}
				sizes="100vw"
				/*
				 * Element LCP na mobile. Serwujemy PREBUILT statyczny WebP (q92) prosto
				 * z `/images/cms/` (CDN, cache 1 rok) — `unoptimized` celowo:
				 *  - znika round-trip do `/_next/image` (na zimnym teście Lighthouse
				 *    on-demand optymalizacja to ~2 s luki FCP→LCP; cache edge jest pusty),
				 *  - `<img src>` = surowy URL = 1:1 z `<link rel=preload>` wstrzykniętym
				 *    przez `priority` → element LCP odkrywany od razu z HTML.
				 * Jakość bez zmian (źródło to nasz WebP q92, nie down-encodujemy ponownie).
				 */
				unoptimized
				placeholder="blur"
				blurDataURL={blurDataURL ?? BRAND_BLUR_DATA_URL}
				className={`absolute inset-0 h-full w-full select-none object-cover ${objectPositionClass}`}
			/>
		</div>
	);
}
