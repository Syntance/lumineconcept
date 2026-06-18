import Image from "next/image";
import {
	MOBILE_HERO_BAND_HEIGHT,
	MOBILE_HERO_BAND_WIDTH,
} from "@/lib/content/cms-hero-image";
import { optimizeCmsHeroImage } from "@/lib/content/asset-url";

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
				priority={priority}
				fetchPriority={priority ? "high" : undefined}
				sizes="100vw"
				quality={90}
				unoptimized={!optimizeCmsHeroImage(src)}
				placeholder={blurDataURL ? "blur" : "empty"}
				blurDataURL={blurDataURL}
				className={`absolute inset-0 h-full w-full select-none object-cover ${objectPositionClass}`}
			/>
		</div>
	);
}
