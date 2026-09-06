import { describe, expect, it } from "vitest";
import {
	CURRENT_HANDLES,
	LEGACY_PRODUCT_SLUGS,
	RETIRED_HANDLES,
	legacyHostRedirects,
	resolveLegacyPath,
} from "@/lib/seo/legacy-redirects";

const redirect = (destination: string) => ({ kind: "redirect", destination });
const GONE = { kind: "gone" };

/** Cel przekierowania musi być produktem z migawki handle'i albo listingiem — nigdy 404. */
const KNOWN_HANDLES = CURRENT_HANDLES;

const LISTINGS = new Set([
	"/sklep/gotowe-wzory",
	"/sklep/certyfikaty",
	"/sklep/tablice-z-logo",
	"/sklep/gotowe-wzory/cenniki",
	"/sklep/gotowe-wzory/tabliczki-qr",
	"/sklep/gotowe-wzory/tabliczki-informacyjne",
	"/sklep/gotowe-wzory/tabliczki-na-drzwi",
	"/sklep/gotowe-wzory/dla-najmlodszych",
	"/sklep/gotowe-wzory/akcesoria-slubne",
]);

function isKnownDestination(destination: string): boolean {
	if (LISTINGS.has(destination)) return true;
	const m = destination.match(/^\/sklep\/gotowe-wzory\/([^/]+)$/);
	return Boolean(m && KNOWN_HANDLES.has(m[1]!));
}

describe("resolveLegacyPath — stare adresy WooCommerce z raportu 404 w Search Console", () => {
	it.each([
		// Slug identyczny z obecnym handle'em → ten sam produkt pod nowym adresem.
		["/index.php/produkt/tabliczka-z-kodami-qr/", "/sklep/gotowe-wzory/tabliczka-z-kodami-qr"],
		["/index.php/produkt/cennik-portal/", "/sklep/gotowe-wzory/cennik-portal"],
		// Zmieniony handle → następca.
		["/index.php/produkt/podziekowania-dla-rodzicow/", "/sklep/gotowe-wzory/podziekowanie-dla-rodzicow"],
		["/index.php/produkt/tabliczka-wifi-zab/", "/sklep/gotowe-wzory/tabliczka-wi-fi-zab"],
		["/index.php/produkt/tabliczka-voucher-podarunkowy/", "/sklep/gotowe-wzory/ekspozytor-na-voucher-podarunkowy"],
		// Produkt bez następcy → listing kategorii.
		["/index.php/produkt/metryczka-z-zyrafa/", "/sklep/gotowe-wzory/dla-najmlodszych"],
		["/index.php/produkt/prosba-o-blogoslawienstwo-eukaliptus/", "/sklep/gotowe-wzory/akcesoria-slubne"],
		["/index.php/produkt/26652/", "/sklep/gotowe-wzory"],
		// Nieznany slug — po słowie kluczowym.
		["/index.php/produkt/cennik-xyz-nieznany/", "/sklep/gotowe-wzory/cenniki"],
		["/index.php/produkt/nowa-tabliczka-qr-nieznana/", "/sklep/gotowe-wzory/tabliczki-qr"],
		["/index.php/produkt/zupelnie-nieznany/", "/sklep/gotowe-wzory"],
		// Kategorie.
		["/index.php/kategoria-produktu/slub/", "/sklep/gotowe-wzory/akcesoria-slubne"],
		["/index.php/kategoria-produktu/slub/prosba-o-blogoslawienstwo/", "/sklep/gotowe-wzory/akcesoria-slubne"],
		["/index.php/kategoria-produktu/twoja-firma/cenniki/", "/sklep/gotowe-wzory/cenniki"],
		["/index.php/kategoria-produktu/twoja-firma/kody-qr/page/1/", "/sklep/gotowe-wzory/tabliczki-qr"],
		["/index.php/kategoria-produktu/twoja-firma/infromacyjne/page/1/", "/sklep/gotowe-wzory/tabliczki-informacyjne"],
		["/index.php/kategoria-produktu/twoja-firma/beauty/", "/sklep/gotowe-wzory"],
		["/index.php/kategoria-produktu/tabliczki-okolicznosciowe/dzieci/page/2/", "/sklep/gotowe-wzory/dla-najmlodszych"],
		["/index.php/kategoria-produktu/pierwsza-komunia/", "/sklep/gotowe-wzory/dla-najmlodszych"],
		["/index.php/kategoria-produktu/", "/sklep/gotowe-wzory"],
		// Sklep i podstrony.
		["/index.php/sklep/", "/sklep"],
		["/index.php/sklep/page/8/", "/sklep"],
		["/index.php/regulamin/", "/regulamin"],
		["/index.php/privacy-policy/", "/polityka-prywatnosci"],
		["/index.php/o-nas/", "/o-nas"],
		["/index.php/kontakt/", "/kontakt"],
		["/index.php/slub/", "/sklep/gotowe-wzory/akcesoria-slubne"],
		["/index.php/tablice-z-logo/", "/sklep/tablice-z-logo"],
		["/index.php/moje-konto/lost-password/", "/"],
		["/index.php/koszyk/", "/koszyk"],
		["/index.php/", "/"],
		["/index.php", "/"],
		["/index", "/"],
		// Wycofane handle pierwszej wersji nowego sklepu — pod każdą kategorią.
		["/sklep/gotowe-wzory/tabliczka-3d-dwa-qr", "/sklep/gotowe-wzory/tabliczka-z-dwoma-kodami-qr"],
		["/sklep/certyfikaty/voucher-podarunkowy", "/sklep/gotowe-wzory/lustrzany-voucher-podarunkowy"],
		["/sklep/tablice-z-logo/pudelko-koperty-mleczne", "/sklep/gotowe-wzory/pudelko-na-koperty-mleczne"],
		["/sklep/certyfikaty/podziekowanie-swiadkow-v1", "/sklep/gotowe-wzory/akcesoria-slubne"],
		// Zakodowane znaki i wielokrotny slash nie psują dopasowania.
		["/index.php/produkt/tabliczka-z-kodami-qr//", "/sklep/gotowe-wzory/tabliczka-z-kodami-qr"],
	])("%s → 308 %s", (from, to) => {
		expect(resolveLegacyPath(from)).toEqual(redirect(to));
	});

	it.each([
		"/index.php/tag-produktu/komunia_swieta/",
		"/index.php/tag-produktu/bestseller/",
		"/index.php/tag/table/",
		"/index.php/category/inspiration/",
		"/index.php/author/admin/",
		"/index.php/2021/08/27/reinterprets-the-classic-bookshelf/",
		"/index.php/wishlist/",
		"/index.php/produkt/podziekowania-dla-rodzicow/feed/",
		"/index.php/kategoria-produktu/tabliczki-okolicznosciowe/feed/",
		"/index.php/cos-czego-nigdy-nie-bylo/",
		"/wp-content/themes/woodmart/style.css",
		"/wp-admin/admin-ajax.php",
		"/wp-json/wp/v2/posts",
		"/xmlrpc.php",
		"/cdn-cgi/l/email-protection",
		"/&",
	])("%s → 410 Gone", (path) => {
		expect(resolveLegacyPath(path)).toEqual(GONE);
	});

	it.each([
		"/",
		"/sklep",
		"/sklep/",
		"/sklep/gotowe-wzory",
		"/sklep/gotowe-wzory/tabliczka-z-kodami-qr",
		"/sklep/certyfikaty/certyfikat-lustrzany",
		"/sklep/gotowe-wzory/cenniki",
		"/o-nas",
		"/api/products",
		"/ingest/static/array.js",
		"/magazyn/panel",
		"/index.html",
		"/indexowanie",
	])("%s — normalny routing (null)", (path) => {
		expect(resolveLegacyPath(path)).toBeNull();
	});

	it("każdy jawny cel przekierowania to istniejący produkt albo listing", () => {
		const destinations = [
			...Object.values(LEGACY_PRODUCT_SLUGS),
			...Object.values(RETIRED_HANDLES),
		];
		const unknown = destinations.filter((d) => !isKnownDestination(d));
		expect(unknown).toEqual([]);
	});

	it("zwraca ścieżkę bez query i bez końcowego slasha", () => {
		const result = resolveLegacyPath("/index.php/sklep/page/2/");
		expect(result).toEqual(redirect("/sklep"));
	});
});

describe("legacyHostRedirects — reguły dla next.config", () => {
	const rules = legacyHostRedirects();

	it("pierwsza reguła przenosi cały host www. na domenę główną (308)", () => {
		const [www] = rules;
		expect(www).toMatchObject({
			source: "/:path*",
			has: [{ type: "host", value: "www.lumineconcept.pl" }],
			destination: "https://lumineconcept.pl/:path*",
			permanent: true,
		});
	});

	it("/index i /index.php prowadzą na stronę główną", () => {
		const bySource = new Map(rules.map((r) => [r.source, r.destination]));
		expect(bySource.get("/index")).toBe("/");
		expect(bySource.get("/index.php")).toBe("/");
	});

	it("wszystkie reguły są trwałe (308) i mają unikalne źródła", () => {
		expect(rules.every((r) => r.permanent)).toBe(true);
		expect(new Set(rules.map((r) => `${r.source}|${JSON.stringify(r.has ?? null)}`)).size).toBe(rules.length);
	});
});
