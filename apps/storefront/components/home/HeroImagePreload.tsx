import { isCmsImageUnoptimized } from "@/lib/content/asset-url";

/**
 * Art-directed preload elementu LCP hero.
 *
 * Hero ma osobny obraz desktop (≥1024px) i mobile (<1024px). `priority` z
 * `next/image` wstrzykuje preload BEZ `media`, więc każdy viewport pobierałby
 * oba warianty. Tu emitujemy `<link rel="preload">` z `media`, dzięki czemu
 * przeglądarka pobiera tylko właściwy obraz — z najwyższym priorytetem, od razu
 * z `<head>` (React 19 hoistuje te `<link>` do head). Eliminuje opóźnione
 * pojawienie się hero po odświeżeniu.
 *
 * Preload href musi być 1:1 z `src` w `<img>`:
 *  - desktop idzie przez `next/image` tylko dla CMS (`unoptimized`) → href = surowy URL,
 *  - mobilny pas zawsze renderuje się `unoptimized` → href = surowy URL.
 * Dla obrazów optymalizowanych przez `/_next/image` URL by się nie zgadzał, więc
 * desktop preload pomijamy (zostaje `loading="eager"`).
 */
export function HeroImagePreload({
	desktopUrl,
	mobileUrl,
}: {
	desktopUrl?: string;
	mobileUrl?: string;
}) {
	const desktopHref =
		desktopUrl && isCmsImageUnoptimized(desktopUrl) ? desktopUrl : undefined;
	const mobileHref = mobileUrl || undefined;

	// Ten sam plik dla obu viewportów — jeden preload bez `media`
	// (dwa `<link>` z tym samym href są deduplikowane przez React, co zgubiłoby `media`).
	if (desktopHref && mobileHref && desktopHref === mobileHref) {
		return (
			<link rel="preload" as="image" href={desktopHref} fetchPriority="high" />
		);
	}

	return (
		<>
			{desktopHref ? (
				<link
					rel="preload"
					as="image"
					href={desktopHref}
					media="(min-width: 1024px)"
					fetchPriority="high"
				/>
			) : null}
			{mobileHref ? (
				<link
					rel="preload"
					as="image"
					href={mobileHref}
					media="(max-width: 1023px)"
					fetchPriority="high"
				/>
			) : null}
		</>
	);
}
