import Image from "next/image";
import { isCmsImageUnoptimized } from "@/lib/content/asset-url";
import { BRAND_BLUR_DATA_URL } from "@/lib/images/blur";
import {
	HERO_IMAGE_QUALITY,
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
	/*
	 * KLUCZOWE dla stabilnego LCP: lokalne hero z `/images/cms/` (oraz R2
	 * `/cms-uploads/`) jest już zoptymalizowanym, zwymiarowanym WebP (q92,
	 * np. 720×1280) wygenerowanym w `sync-cms-to-static`. Serwujemy je
	 * `unoptimized` — bezpośrednio jako statyczny plik z CDN (immutable cache).
	 *
	 * Dlaczego: przejście przez `/_next/image` dodaje `&dpl=<hash>` do URL, więc
	 * KAŻDY deploy unieważnia cache optymalizatora. Pierwszy request (ten od
	 * Lighthouse/PageSpeed) = MISS = generowanie on-demand (0,5–2 s pod
	 * throttlingiem) przy ZEROWYM zysku rozmiaru (wariant „zoptymalizowany"
	 * waży tyle samo co źródło). To była przyczyna wysokiego LCP i wahań
	 * wyniku (raz 92 = ciepły cache, raz 73 = zimny po deployu).
	 */
	const unoptimized = isCmsImageUnoptimized(src);
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
			 * Z `unoptimized` preload href === <img src> (statyczny URL), więc
			 * preload trafia idealnie i nie ma podwójnego pobrania.
			 */
			unoptimized={unoptimized}
			priority={priority}
			fetchPriority={priority ? "high" : "auto"}
			sizes="100vw"
			quality={HERO_IMAGE_QUALITY}
			placeholder="blur"
			blurDataURL={blurDataURL ?? BRAND_BLUR_DATA_URL}
			className={`absolute inset-0 h-full w-full select-none object-cover ${objectPositionClass}`}
		/>
		</div>
	);
}
