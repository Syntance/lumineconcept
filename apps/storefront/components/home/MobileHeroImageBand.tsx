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
			/*
			 * `priority` = kluczowe dla LCP na mobile:
			 *   – dodaje <link rel="preload" fetchpriority="high"> w <head>
			 *   – ustawia loading="eager" na <img>
			 *
			 * `fetchPriority` na <img> jawnie (nie tylko via preload link):
			 *   – Lighthouse "LCP request detection" wymaga fetchpriority="high"
			 *     bezpośrednio na <img>, nie tylko na <link rel="preload">.
			 *
			 * Bez `unoptimized`: Vercel Image Optimizer serwuje właściwy rozmiar
			 * (np. 828px dla 2× DPR na 414px) zamiast pełnego 1080px WebP.
			 * Preload URL = /_next/image?url=...&w=828 = dokładnie to co <img src>.
			 * Eliminuje mismatch URL między preload a img src.
			 */
			priority={priority}
			fetchPriority={priority ? "high" : "auto"}
			sizes="100vw"
			quality={85}
			placeholder="blur"
			blurDataURL={blurDataURL ?? BRAND_BLUR_DATA_URL}
			className={`absolute inset-0 h-full w-full select-none object-cover ${objectPositionClass}`}
		/>
		</div>
	);
}
