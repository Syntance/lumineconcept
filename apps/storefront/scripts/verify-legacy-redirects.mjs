#!/usr/bin/env node
/**
 * Weryfikacja starych adresów na żywej stronie.
 *
 * `verify-seo-indexing.mjs` pyta „czy obecne strony da się zaindeksować".
 * Ten skrypt pyta o drugą połowę: czy adresy sprzed migracji **zniknęły** z
 * indeksu — czyli czy każdy z nich odpowiada tak, jak obiecuje
 * `lib/seo/legacy-redirects.ts`:
 *
 *   kind: "redirect"  →  301/308 na DOKŁADNIE tę ścieżkę, którą deklaruje moduł
 *   kind: "gone"      →  410 (Google usuwa takie adresy z indeksu szybciej niż
 *                        przy 404 i przestaje je regularnie odpytywać)
 *
 * Stary adres, który zwraca 200, jest gorszy niż 404 — to duplikat treści pod
 * drugim URL-em. Stary adres, który zwraca 404 zamiast 410, zostaje w GSC
 * miesiącami. Oba przypadki są tu błędem.
 *
 * Przypadki NIE są przepisane ręcznie — skrypt importuje `resolveLegacyPath`
 * i tabele slugów z modułu, więc lista testowa nie może rozjechać się z
 * implementacją. Kandydaci, dla których moduł zwraca `null` (adres nie jest
 * stary), są pomijane.
 *
 * Użycie:
 *   node --experimental-strip-types scripts/verify-legacy-redirects.mjs
 *   node --experimental-strip-types scripts/verify-legacy-redirects.mjs https://staging.example.com
 *
 * Kod wyjścia 1, gdy cokolwiek odpowiada inaczej, niż obiecuje moduł.
 */

import {
	CURRENT_HANDLES,
	LEGACY_PRODUCT_SLUGS,
	PRIMARY_HOST,
	RETIRED_HANDLES,
	resolveLegacyPath,
} from "../lib/seo/legacy-redirects.ts";

const BASE = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || `https://${PRIMARY_HOST}`)
	.trim()
	.replace(/\/+$/, "");

const CONCURRENCY = 6;

const GREEN = "[32m";
const RED = "[31m";
const DIM = "[2m";
const RESET = "[0m";

/** Kandydaci do sprawdzenia. Moduł decyduje, które z nich są faktycznie stare. */
function candidatePaths() {
	const paths = new Set();

	// Produkty WooCommerce — zmienione slugi i te, które nazwy nie zmieniły.
	for (const slug of Object.keys(LEGACY_PRODUCT_SLUGS)) paths.add(`/index.php/produkt/${slug}`);
	for (const handle of CURRENT_HANDLES) paths.add(`/index.php/produkt/${handle}`);

	// Handle wycofane już po migracji — żyją pod obecnymi ścieżkami kategorii.
	for (const handle of Object.keys(RETIRED_HANDLES)) {
		paths.add(`/sklep/gotowe-wzory/${handle}`);
		paths.add(`/sklep/certyfikaty/${handle}`);
		paths.add(`/sklep/tablice-z-logo/${handle}`);
	}

	// Listingi kategorii starego sklepu.
	for (const category of [
		"",
		"/slub",
		"/tablice-z-logo",
		"/certyfikaty",
		"/tabliczki-okolicznosciowe",
		"/nieistniejaca-kategoria",
	]) {
		paths.add(`/index.php/kategoria-produktu${category}`);
	}

	// Podstrony i sklep.
	for (const page of [
		"/sklep",
		"/sklep/strona/2",
		"/regulamin",
		"/privacy-policy",
		"/o-nas",
		"/kontakt",
		"/okazje",
		"/koszyk",
		"/zamowienie",
		"/moje-konto/lost-password",
	]) {
		paths.add(`/index.php${page}`);
	}

	// 410 Gone — sekcje, których nie ma i nie będzie.
	for (const gone of [
		"/index.php/tag/plexi",
		"/index.php/tag-produktu/plexi",
		"/index.php/category/aktualnosci",
		"/index.php/author/admin",
		"/index.php/wishlist",
		"/index.php/2023/11/wpis",
		"/index.php/2023/11/wpis/feed",
		"/index.php/feed",
		"/wp-content/uploads/2023/11/plik.jpg",
		"/wp-includes/js/x.js",
		"/wp-admin",
		"/wp-login.php",
		"/xmlrpc.php",
		"/wp-json/wp/v2/posts",
		"/cdn-cgi/trace",
	]) {
		paths.add(gone);
	}

	// Wprost z `redirects()` w next.config.
	paths.add("/index");
	paths.add("/index.php");
	paths.add("/odbioru");

	return [...paths].sort();
}

function pathOf(location, base) {
	try {
		const url = new URL(location, base);
		return `${url.pathname.replace(/\/+$/, "") || "/"}${url.search}`;
	} catch {
		return location;
	}
}

async function head(url, host) {
	// GET, nie HEAD — Next bywa inaczej skonfigurowany dla HEAD, a Googlebot i tak GET-uje.
	const response = await fetch(url, {
		method: "GET",
		redirect: "manual",
		headers: { "User-Agent": "lumine-seo-verify", ...(host ? { Host: host } : {}) },
	});
	return { status: response.status, location: response.headers.get("location") };
}

async function checkLegacyPath(path) {
	const expected = resolveLegacyPath(path);
	if (!expected) return null; // Nie jest starym adresem — nie nasza sprawa.

	const url = `${BASE}${path}`;
	let status;
	let location;
	try {
		({ status, location } = await head(url, null));
	} catch (error) {
		return { path, ok: false, message: `nieudane pobranie: ${error.message}` };
	}

	if (expected.kind === "gone") {
		if (status === 410) return { path, ok: true };
		const hint = status === 404 ? " (404 zamiast 410 — zostaje w GSC znacznie dłużej)" : "";
		return { path, ok: false, message: `oczekiwano 410, jest ${status}${hint}` };
	}

	if (status !== 301 && status !== 308) {
		const hint = status === 200 ? " — stary adres serwuje treść, czyli duplikat" : "";
		return { path, ok: false, message: `oczekiwano 301/308, jest ${status}${hint}` };
	}

	const actual = pathOf(location ?? "", BASE);
	if (actual !== expected.destination) {
		return { path, ok: false, message: `${status} → ${actual}, oczekiwano ${expected.destination}` };
	}

	return { path, ok: true };
}

/** Host `www.` serwował pełną kopię witryny — Google skanował obie. */
async function checkWwwHost() {
	const target = new URL(BASE);
	if (target.hostname !== PRIMARY_HOST) {
		return [{ path: `www.${PRIMARY_HOST}`, ok: true, skipped: true }];
	}

	const out = [];
	for (const path of ["/", "/sklep"]) {
		const url = `https://www.${PRIMARY_HOST}${path}`;
		try {
			const { status, location } = await head(url, null);
			if (status !== 301 && status !== 308) {
				const hint = status === 200 ? " — druga kopia witryny pod osobnym hostem" : "";
				out.push({ path: url, ok: false, message: `oczekiwano 301/308, jest ${status}${hint}` });
				continue;
			}
			const host = location ? new URL(location, url).hostname : "";
			if (host !== PRIMARY_HOST) {
				out.push({ path: url, ok: false, message: `${status} → host ${host || "?"}` });
				continue;
			}
			out.push({ path: url, ok: true });
		} catch (error) {
			out.push({ path: url, ok: false, message: `nieudane pobranie: ${error.message}` });
		}
	}
	return out;
}

async function mapWithConcurrency(items, worker) {
	const results = new Array(items.length);
	let cursor = 0;
	await Promise.all(
		Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
			while (cursor < items.length) {
				const index = cursor++;
				results[index] = await worker(items[index]);
			}
		}),
	);
	return results;
}

async function main() {
	const candidates = candidatePaths();
	const legacy = candidates.filter((path) => resolveLegacyPath(path) !== null);

	process.stdout.write(
		`${DIM}${BASE} — ${legacy.length} starych adresów do sprawdzenia ` +
			`(z ${candidates.length} kandydatów; resztę obsługuje normalny routing)${RESET}\n\n`,
	);

	const results = (await mapWithConcurrency(legacy, checkLegacyPath)).filter(Boolean);
	results.push(...(await checkWwwHost()));

	const failures = results.filter((r) => !r.ok);
	for (const { path, message } of failures) {
		process.stdout.write(`${RED}BŁĄD${RESET}  ${path}\n      ${message}\n`);
	}

	// Pominięte (np. test hosta `www.` przy uruchomieniu na innej domenie) nie
	// są zaliczeniem — inaczej raport chwaliłby się kontrolą, której nie zrobił.
	const skipped = results.filter((r) => r.skipped);
	const checked = results.length - skipped.length;
	const passed = checked - failures.length;
	const skippedNote = skipped.length > 0 ? ` ${DIM}(${skipped.length} pominięte)${RESET}` : "";

	process.stdout.write(
		failures.length === 0
			? `\n${GREEN}${passed}/${checked} starych adresów odpowiada zgodnie z legacy-redirects.ts${RESET}${skippedNote}\n`
			: `\n${GREEN}${passed} OK${RESET} · ${RED}${failures.length} błędów${RESET}${skippedNote}\n`,
	);

	process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((error) => {
	process.stderr.write(`${RED}${error.stack ?? error}${RESET}\n`);
	process.exit(1);
});
