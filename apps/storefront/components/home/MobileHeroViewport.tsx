import type { ReactNode } from "react";

/** Całe mobile hero (zdjęcie + CTA) — ~80% wysokości ekranu iPhone. */
export const MOBILE_HERO_VIEWPORT_CLASS =
	"flex h-[80svh] max-h-[80svh] min-h-0 flex-col overflow-hidden";

type MobileHeroViewportProps = {
	image: ReactNode;
	portal: ReactNode;
	/** Np. breadcrumbs na warstwie nad zdjęciem. */
	imageOverlay?: ReactNode;
};

/**
 * Mobile hero: zdjęcie wypełnia resztę, brązowy blok CTA ma stałą wysokość — razem 80svh.
 */
export function MobileHeroViewport({ image, portal, imageOverlay }: MobileHeroViewportProps) {
	return (
		<div className={MOBILE_HERO_VIEWPORT_CLASS}>
			<div className="relative min-h-0 flex-1">
				{image}
				{imageOverlay}
			</div>
			<div className="shrink-0">{portal}</div>
		</div>
	);
}
