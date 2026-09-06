import type { NextConfig } from "next";

/**
 * Stare adresy sprzed migracji (WordPress/WooCommerce pod `/index.php/...`,
 * wycofane handle pierwszej wersji nowego sklepu, host `www.`) → obecne
 * strony. Źródło listy: raport „Strony" w Search Console — 204 adresy 404,
 * 27 z przekierowaniem, 65 „alternatywnych" — wszystkie sprowadzone tutaj do
 * trzech decyzji: przekieruj na konkretny produkt, przekieruj na najbliższy
 * listing, albo 410 Gone (nic sensownego nie istnieje — Google usuwa takie
 * adresy z indeksu szybciej niż przy 404 i przestaje je regularnie odpytywać).
 *
 * Czysta logika (bez `next/server`), żeby dało się ją testować jednostkowo.
 * Konsumenci: `next.config.ts` (`legacyHostRedirects`) i `middleware.ts`
 * (`resolveLegacyPath`).
 */

export const PRIMARY_HOST = "lumineconcept.pl";

/** Jeden wpis `redirects()` z next.config — typ wyprowadzony, bez importu z wnętrza Next. */
export type LegacyRedirectRule = Awaited<ReturnType<NonNullable<NextConfig["redirects"]>>>[number];

export type LegacyResolution =
	| { kind: "gone" }
	| { kind: "redirect"; destination: string };

const GOTOWE = "/sklep/gotowe-wzory";
const CERTYFIKATY = "/sklep/certyfikaty";
const TABLICE_Z_LOGO = "/sklep/tablice-z-logo";

/** Listingi podkategorii `/sklep/gotowe-wzory/<handle kategorii>` (kategorie w Medusie). */
const LISTING = {
	cenniki: `${GOTOWE}/cenniki`,
	qr: `${GOTOWE}/tabliczki-qr`,
	informacyjne: `${GOTOWE}/tabliczki-informacyjne`,
	dzieci: `${GOTOWE}/dla-najmlodszych`,
	slub: `${GOTOWE}/akcesoria-slubne`,
} as const;

const product = (handle: string): string => `${GOTOWE}/${handle}`;

/**
 * Handle produktów w Medusie (Store API, stan z 6.09.2026). Stary slug
 * WooCommerce identyczny z handle'em → ten sam produkt pod nowym adresem.
 * Migawka celowo statyczna: middleware na edge'u nie może pytać Medusy
 * o każdy stary adres, a lista starych slugów jest skończona i zamknięta.
 */
export const CURRENT_HANDLES: ReadonlySet<string> = new Set([
	"certyfikat-lustrzany",
	"cennik-z-elementami-3d",
	"tabliczka-3d-z-kodami-qr",
	"tabliczka-wi-fi",
	"ekspozytor-na-voucher-podarunkowy",
	"koszyk-ratunkowy",
	"instrukcja-aparatu-instax",
	"lustrzana-instrukcja-aparatu-instax",
	"iskierki-milosci-lustrzana-tabliczka",
	"pudelko-na-koperty-mleczne",
	"pamiatka-pierwszej-komunii-swietej",
	"cennik-klasyczny",
	"cennik-portal",
	"cennik-ze-scietym-bokiem",
	"tabliczka-z-kodami-qr-fala",
	"tabliczka-3d-z-kodami-qr-2",
	"tabliczka-3d-z-kodami-qr-3",
	"tabliczka-z-dwoma-kodami-qr",
	"tabliczka-z-kodami-qr",
	"tabliczka-z-4-kodami-qr",
	"tabliczka-qr-zab",
	"tabliczka-z-nazwa-pomieszczenia",
	"instrukcja-mycia-rak",
	"instrukcja-mycia-rak-owalna",
	"instrukcja-mycia-rak-fala",
	"tabliczka-higiena",
	"piktogram-gasnica",
	"zakaz-palenia",
	"zalecenia-pielegnacyjna",
	"zalecenia-pielegnacyjne",
	"zalecenia-pielegnacyjne-3d",
	"tabliczka-wi-fi-z-logo",
	"tabliczka-wi-fi-zab",
	"oktagon-z-kodem-qr-wi-fi",
	"drink-menu-3d",
	"lustrzany-voucher-podarunkowy",
	"wizytownik-3d",
	"podziekowanie-dla-rodzicow",
	"zawieszka-na-drzwi",
	"certyfikat-ze-zdjeciem",
	"tabliczka-z-kodami-qr-2",
	"tabliczka-z-kodami-qr-stone",
	"tabliczka-z-kodami-qr-owalna",
]);

/**
 * Stare slugi WooCommerce (`/index.php/produkt/<slug>/`) → obecny handle
 * w Medusie (ten sam produkt lub jego następca) albo najbliższy listing.
 * Slugi identyczne z obecnym handle'em NIE muszą tu być — obsługuje je
 * `resolveProductSlug` (przekierowanie 1:1 na `/sklep/gotowe-wzory/<slug>`).
 */
export const LEGACY_PRODUCT_SLUGS: Readonly<Record<string, string>> = {
	// Podziękowania ślubne — jeden produkt zastąpił kilka wariantów.
	"podziekowania-dla-rodzicow": product("podziekowanie-dla-rodzicow"),
	"podziekowanie-dla-rodzicow-ze-zdjeciem": product("podziekowanie-dla-rodzicow"),
	"podziekowanie-dla-rodzicow-dziadkow": product("podziekowanie-dla-rodzicow"),
	"podziekowanie-dla-rodzicow-dziadkow-2": product("podziekowanie-dla-rodzicow"),
	"podziekowania-dla-rodzicow-zlote-srebrne": product("podziekowanie-dla-rodzicow"),
	"podziekowania-dla-rodzicow-kolo": product("podziekowanie-dla-rodzicow"),
	"podziekowanie-dla-swiadkow": LISTING.slub,
	"podziekowanie-dla-swiadkow-2": LISTING.slub,
	// Wi-Fi
	"tabliczka-wifi-zab": product("tabliczka-wi-fi-zab"),
	"tabliczka-3d-wi-fi": product("tabliczka-wi-fi"),
	"tabliczka-wi-fi-3d-kolorowa": product("tabliczka-wi-fi"),
	// Menu / cenniki
	"drink-menu-3d-2": product("drink-menu-3d"),
	"cennik-z-elementami-3d-2": product("cennik-z-elementami-3d"),
	"cennik-akrylowy-kolorowy": product("cennik-klasyczny"),
	"cennik-na-szkle-akrylowym": product("cennik-klasyczny"),
	// Informacyjne / BHP
	"instrukcja-mycia-rak-okragla": product("instrukcja-mycia-rak-owalna"),
	"tabliczka-higiena-2": product("tabliczka-higiena"),
	"zalecenia-po-przedluzaniu-rzes-3d": product("zalecenia-pielegnacyjne-3d"),
	"tabliczka-informacyjna-pielegnacja-brwi-po-laminacji": product("zalecenia-pielegnacyjna"),
	"tabliczka-informacyjna": LISTING.informacyjne,
	"kolorowa-tabliczka-z-nazwa-pomieszczenia": product("tabliczka-z-nazwa-pomieszczenia"),
	// Kody QR
	"kolorowa-tabliczka-3d-z-dwoma-kodami-qr": product("tabliczka-z-dwoma-kodami-qr"),
	"kolorowa-tabliczka-3d-z-kodami-qr": product("tabliczka-3d-z-kodami-qr"),
	"tabliczka-z-3-kodami-qr": product("tabliczka-z-kodami-qr"),
	"heksagon-3d-lejace-zloto": LISTING.qr,
	"heksagon-3d-z-kodami-qr": LISTING.qr,
	"tabliczka-babeczka-qr": LISTING.qr,
	"wizytownik-z-logo": product("wizytownik-3d"),
	// Instax / ślub
	"instrukcja-aparat-instax-wesele-ksiega-gosci": product("instrukcja-aparatu-instax"),
	"instrukcja-aparatu-instax-srebrna": product("lustrzana-instrukcja-aparatu-instax"),
	"iskierka-milosci": product("iskierki-milosci-lustrzana-tabliczka"),
	"iskierka-milosci-lustrzana": product("iskierki-milosci-lustrzana-tabliczka"),
	"pudelko-na-koperty-pleksi-przezroczyste": product("pudelko-na-koperty-mleczne"),
	"pudelko-na-koperty-pleksi-inicjaly": product("pudelko-na-koperty-mleczne"),
	"prosba-o-blogoslawienstwo-w-pudeleczku-bialo-zlota": LISTING.slub,
	"prosba-o-blogoslawienstwo-w-pudeleczku-bialo-srebrna": LISTING.slub,
	"prosba-o-blogoslawienstwo-eukaliptus": LISTING.slub,
	"prosba-o-blogoslawienstwo-drewniane-pudelko": LISTING.slub,
	"kotylion-najlepsza-swiadkowa": LISTING.slub,
	"pudelko-na-wino-personalizowane": LISTING.slub,
	"pudelko-na-obraczki-biale-personalizowane": LISTING.slub,
	"tabliczka-ta-swieca-plonie": LISTING.slub,
	// Vouchery
	"tabliczka-voucher-podarunkowy": product("ekspozytor-na-voucher-podarunkowy"),
	"voucher-podarunkowy": product("lustrzany-voucher-podarunkowy"),
	// Komunia / chrzest / dzieci
	"pamiatka-i-komunii": product("pamiatka-pierwszej-komunii-swietej"),
	"pamiatka-i-komunii-2": product("pamiatka-pierwszej-komunii-swietej"),
	"pamiatka-i-komunii-kopia": product("pamiatka-pierwszej-komunii-swietej"),
	"pamiatka-chrztu-swietego": LISTING.dzieci,
	"pamiatka-chrztu-swietego-w-pudelku": LISTING.dzieci,
	// Okolicznościowe bez następcy — listing główny.
	"tabliczka-z-piosenka": GOTOWE,
	"szkielko-z-zyczeniami": GOTOWE,
	"kolaz-z-zyczeniami": GOTOWE,
	"szkatulka-na-dzien-babci-i-dziadka": GOTOWE,
};

/**
 * Handle z pierwszej wersji nowego sklepu, które zniknęły z Medusy
 * (`/sklep/<kategoria>/<handle>` → 404). Google zna je z pierwszej sitemapy.
 */
export const RETIRED_HANDLES: Readonly<Record<string, string>> = {
	"tabliczka-3d-dwa-qr": product("tabliczka-z-dwoma-kodami-qr"),
	"heksagon-z-kodami-qr": LISTING.qr,
	"pudelko-koperty-mleczne": product("pudelko-na-koperty-mleczne"),
	"tabliczka-3d-qr-podstawowa": product("tabliczka-3d-z-kodami-qr"),
	"tabliczka-3d-qr-premium": product("tabliczka-3d-z-kodami-qr-2"),
	"tabliczka-voucher-podarunkowy": product("ekspozytor-na-voucher-podarunkowy"),
	"voucher-podarunkowy": product("lustrzany-voucher-podarunkowy"),
	"tabliczka-z-4-kodami-qr-kopia": product("tabliczka-z-4-kodami-qr"),
	"tabliczka-4-qr-pionowa": product("tabliczka-z-4-kodami-qr"),
	"tabliczka-babeczka-qr": LISTING.qr,
	"podziekowanie-rodzicow-dziadkow": product("podziekowanie-dla-rodzicow"),
	"podziekowanie-swiadkow-v1": LISTING.slub,
};

/** Stare podstrony WordPressa (`/index.php/<slug>/`). */
const LEGACY_PAGES: Readonly<Record<string, string>> = {
	"/regulamin": "/regulamin",
	"/privacy-policy": "/polityka-prywatnosci",
	"/polityka-prywatnosci": "/polityka-prywatnosci",
	"/o-nas": "/o-nas",
	"/kontakt": "/kontakt",
	"/okazje": "/sklep",
	"/dla-firmy": GOTOWE,
	"/slub": LISTING.slub,
	"/tabliczki-okolicznosciowe": GOTOWE,
	"/tablice-z-logo": TABLICE_Z_LOGO,
	"/koszyk": "/koszyk",
	"/zamowienie": "/koszyk",
	"/moje-konto": "/",
};

/** Stare kategorie WooCommerce (`/index.php/kategoria-produktu/<ścieżka>/`) — dopasowanie po prefiksie. */
const LEGACY_CATEGORY_PREFIXES: ReadonlyArray<readonly [RegExp, string]> = [
	[/^slub(\/|$)/, LISTING.slub],
	[/^twoja-firma\/cenniki(\/|$)/, LISTING.cenniki],
	[/^twoja-firma\/kody-qr(\/|$)/, LISTING.qr],
	// „infromacyjne" — literówka w slugu starego sklepu, Google ją zna.
	[/^twoja-firma\/(infromacyjne|informacyjne)(\/|$)/, LISTING.informacyjne],
	[/^twoja-firma\/menu(\/|$)/, LISTING.informacyjne],
	[/^twoja-firma(\/|$)/, GOTOWE],
	[/^tabliczki-okolicznosciowe\/dzieci(\/|$)/, LISTING.dzieci],
	[/^tabliczki-okolicznosciowe(\/|$)/, GOTOWE],
	[/^pierwsza-komunia(\/|$)/, LISTING.dzieci],
	[/^certyfikaty(\/|$)/, CERTYFIKATY],
	[/^(logo|logo-3d|tablice-z-logo)(\/|$)/, TABLICE_Z_LOGO],
];

/** Nieznany stary slug produktu → listing po słowie kluczowym w slugu. */
const PRODUCT_SLUG_FALLBACKS: ReadonlyArray<readonly [RegExp, string]> = [
	[/cennik/, LISTING.cenniki],
	[/wi-?fi/, product("tabliczka-wi-fi")],
	[/qr/, LISTING.qr],
	[/metryczka|chrzt|komuni/, LISTING.dzieci],
	[/podziekowan|blogoslawienstw|swiadk|wesel|slub/, LISTING.slub],
	[/instrukcja-mycia-rak/, product("instrukcja-mycia-rak")],
	[/zalecenia|higien|zakaz|piktogram|informacyjn/, LISTING.informacyjne],
];

/**
 * Adresy, po których nie ma czego szukać: tagi, autorzy, archiwa bloga,
 * feedy, wishlisty, pliki motywu WordPressa, artefakty Cloudflare.
 */
const GONE_PATTERNS: ReadonlyArray<RegExp> = [
	/^\/(wp-content|wp-includes|wp-admin|wp-json|wp-login\.php|xmlrpc\.php)(\/|$)/,
	/^\/cdn-cgi\//,
	/^\/&$/,
];

const GONE_LEGACY_SECTIONS = /^\/(tag-produktu|tag|category|author|wishlist|comments|feed|\d{4})(\/|$)/;

const PRODUCT_CATEGORY_SEGMENT = /^\/sklep\/(gotowe-wzory|certyfikaty|tablice-z-logo)\/([^/]+)$/;

function normalizePath(pathname: string): string {
	let decoded = pathname;
	try {
		decoded = decodeURIComponent(pathname);
	} catch {
		/* zostaje surowa ścieżka */
	}
	const trimmed = decoded.replace(/\/+$/, "");
	return trimmed === "" ? "/" : trimmed;
}

function resolveProductSlug(slug: string): string {
	const explicit = LEGACY_PRODUCT_SLUGS[slug];
	if (explicit) return explicit;
	if (CURRENT_HANDLES.has(slug)) return product(slug);
	for (const [pattern, destination] of PRODUCT_SLUG_FALLBACKS) {
		if (pattern.test(slug)) return destination;
	}
	return GOTOWE;
}

function resolveCategoryPath(categoryPath: string): string {
	for (const [pattern, destination] of LEGACY_CATEGORY_PREFIXES) {
		if (pattern.test(categoryPath)) return destination;
	}
	return GOTOWE;
}

/**
 * Decyzja dla starego adresu; `null` = adres nie jest stary (obsługuje go
 * normalny routing). Ścieżka bez query — parametry starego sklepu
 * (`per_page`, `shop_view`) są celowo gubione przy przekierowaniu.
 */
export function resolveLegacyPath(pathname: string): LegacyResolution | null {
	const path = normalizePath(pathname);

	const retired = path.match(PRODUCT_CATEGORY_SEGMENT);
	if (retired) {
		const destination = RETIRED_HANDLES[retired[2]!];
		return destination ? { kind: "redirect", destination } : null;
	}

	if (GONE_PATTERNS.some((pattern) => pattern.test(path))) return { kind: "gone" };

	if (path === "/index.php" || path === "/index") return { kind: "redirect", destination: "/" };
	if (!path.startsWith("/index.php/")) return null;

	const rest = path.slice("/index.php".length);

	if (/\/feed$/.test(rest) || GONE_LEGACY_SECTIONS.test(rest)) return { kind: "gone" };

	const productMatch = rest.match(/^\/produkt\/([^/]+)(\/.*)?$/);
	if (productMatch) {
		return { kind: "redirect", destination: resolveProductSlug(productMatch[1]!) };
	}

	const categoryMatch = rest.match(/^\/kategoria-produktu(?:\/(.*))?$/);
	if (categoryMatch) {
		return { kind: "redirect", destination: resolveCategoryPath(categoryMatch[1] ?? "") };
	}

	if (/^\/sklep(\/|$)/.test(rest)) return { kind: "redirect", destination: "/sklep" };

	// Podstrony po pierwszym segmencie (`/moje-konto/lost-password` → `/`).
	const page = LEGACY_PAGES[`/${rest.split("/")[1] ?? ""}`];
	if (page) return { kind: "redirect", destination: page };

	return { kind: "gone" };
}

/**
 * Reguły dla `redirects()` w next.config — wykonywane na edge'u PRZED
 * middleware: host `www.` → domena główna (cała witryna była dostępna pod
 * dwoma hostami i Google skanował obie kopie) oraz `/index`, `/index.php`.
 */
export function legacyHostRedirects(): LegacyRedirectRule[] {
	return [
		{
			source: "/:path*",
			has: [{ type: "host", value: `www.${PRIMARY_HOST}` }],
			destination: `https://${PRIMARY_HOST}/:path*`,
			permanent: true,
		},
		{ source: "/index", destination: "/", permanent: true },
		{ source: "/index.php", destination: "/", permanent: true },
		{ source: "/odbioru", destination: "/dostawa-i-platnosci", permanent: true },
	];
}
