import { BRAND_BLUR_DATA_URL } from "@/lib/images/blur";
import {
	MOBILE_HERO_BAND_HEIGHT,
	MOBILE_HERO_BAND_WIDTH,
	toHeroAvifSrc,
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
	/*
	 * Opcja maksymalna dla LCP:
	 *
	 * 1. Statyczny AVIF z prebuild (sync-cms-to-static generuje .avif obok .webp
	 *    dla każdego hero). AVIF q70 ≈ ~50% mniej bajtów niż WebP q92 przy
	 *    zbliżonej percepcji wizualnej. Serwowany jako immutable z CDN.
	 *
	 * 2. Native <picture> zamiast next/image — brak &dpl= w URL, więc cache
	 *    immutable nie resetuje się po każdym deployu (to był główny powód
	 *    wahań 73–92 w PageSpeed).
	 *
	 * 3. Preload AVIF z <link rel="preload" type="image/avif"> w HeroSection
	 *    (RSC, hoistowany do <head>) — tylko dla przeglądarek z obsługą AVIF.
	 *    Brak AVIF → przeglądarka pobiera WebP fallback z <img src>.
	 *
	 * 4. Blur placeholder via CSS background na wrapperze (next/image był
	 *    jedynym dostarczycielem blur; zastępujemy go bez biblioteki).
	 */
	const avifSrc = toHeroAvifSrc(src);
	const blur = blurDataURL ?? BRAND_BLUR_DATA_URL;

	return (
		<div
			className="relative h-full w-full overflow-hidden"
			style={{
				backgroundImage: `url(${blur})`,
				backgroundSize: "cover",
				backgroundPosition: "center 58%",
			}}
		>
			<picture>
				{avifSrc && <source type="image/avif" srcSet={avifSrc} />}
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={src}
					alt=""
					width={MOBILE_HERO_BAND_WIDTH}
					height={MOBILE_HERO_BAND_HEIGHT}
					loading="eager"
					fetchPriority={priority ? "high" : "auto"}
					decoding="async"
					className={`absolute inset-0 h-full w-full select-none object-cover ${objectPositionClass}`}
					style={{ color: "transparent" }}
				/>
			</picture>
		</div>
	);
}
