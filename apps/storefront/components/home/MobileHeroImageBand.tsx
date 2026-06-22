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
				 *   – Next.js 15 / React 19 wywołuje `ReactDOM.preload()` który trafia
				 *     do `<head>` natychmiast, nawet gdy komponent jest zagnieżdżony
				 *     głęboko w async tree (czego zwykły `<link rel=preload>` w JSX nie
				 *     gwarantuje przy streaming SSR).
				 *   – Ustawia też `loading="eager"` i `fetchPriority="high"` implicite.
				 *   – Preload nie jest media-scoped (obowiązuje też na desktop), ale
				 *     mobile hero to tylko ~75 KB — koszt pomijalny.
				 */
				priority={priority}
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
