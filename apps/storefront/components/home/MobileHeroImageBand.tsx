import Image from "next/image";

import { isCmsImageUnoptimized } from "@/lib/content/asset-url";

export const MOBILE_HERO_BAND_WIDTH = 1080;
export const MOBILE_HERO_BAND_HEIGHT = 1350;

type MobileHeroImageBandProps = {
	src: string;
	priority?: boolean;
};

/** Zdjęcie wypełnia obszar flex-1 rodzica — object-cover wyśrodkowany pionowo. */
export function MobileHeroImageBand({ src, priority = true, blurDataURL }: MobileHeroImageBandProps & { blurDataURL: string }) {
	return (
		<div className="relative h-full w-full">
			<Image
				src={src}
				alt=""
				width={MOBILE_HERO_BAND_WIDTH}
				height={MOBILE_HERO_BAND_HEIGHT}
				priority={priority}
				fetchPriority={priority ? "high" : undefined}
				unoptimized
				placeholder="blur"
				blurDataURL={blurDataURL}
				className="absolute inset-0 h-full w-full select-none object-cover object-center"
			/>
		</div>
	);
}
