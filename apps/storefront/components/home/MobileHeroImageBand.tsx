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
				 * UWAGA: `priority` + `unoptimized` w Next.js 16 NIE dodaje
				 * `fetchpriority="high"` na element <img> ani na <link rel="preload"> —
				 * tylko bez `unoptimized` to robi. Dlatego ustawiamy oba atrybuty jawnie:
				 *   – `fetchPriority="high"` → bezpośredni sygnał dla przeglądarki (LCP)
				 *   – `loading="eager"` → blokuje lazy loading
				 *   – `priority` → dodaje <link rel="preload"> w <head> (wczesna dyskowerya)
				 */
				priority={priority}
				// Jawne atrybuty HTML — konieczne obok `priority`, bo ten z `unoptimized` ich nie dodaje
				fetchPriority={priority ? "high" : "auto"}
				loading={priority ? "eager" : "lazy"}
				sizes="100vw"
				/*
				 * `unoptimized` — plik to już WebP q92 z prebuild; nie kompresujemy
				 * ponownie przez /_next/image. Eliminuje round-trip do edge optimizera
				 * na zimnym starcie (cache MISS = +2 s FCP→LCP wg Lighthouse).
				 */
				unoptimized
				placeholder="blur"
				blurDataURL={blurDataURL ?? BRAND_BLUR_DATA_URL}
				className={`absolute inset-0 h-full w-full select-none object-cover ${objectPositionClass}`}
			/>
		</div>
	);
}
