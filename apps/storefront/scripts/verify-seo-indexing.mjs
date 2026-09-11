#!/usr/bin/env node
/**
 * Weryfikacja indeksowalności na żywej stronie.
 *
 * Pobiera `sitemap.xml`, wchodzi na KAŻDY zgłoszony URL i sprawdza cztery
 * rzeczy, które decydują o tym, czy Google w ogóle może stronę zaindeksować:
 *
 *  1. status HTTP — 200 (przekierowanie albo 404 w sitemapie to błąd w GSC),
 *  2. `<link rel="canonical">` — musi wskazywać na TEN SAM adres, pod którym
 *     strona jest zgłoszona; rozjazd = „Strona alternatywna ze znacznikiem
 *     canonical" i brak indeksacji,
 *  3. `<meta name="robots">` — `noindex` w sitemapie to błąd „Przesłany adres
 *     URL oznaczony jako noindex",
 *  4. linkowanie wewnętrzne — czy do każdego produktu prowadzi `<a href>` w
 *     HTML renderowanym serwerowo. Adres znany wyłącznie z sitemapy dostaje
 *     najniższy priorytet skanowania; właśnie tak 27 z 43 produktów utknęło w
 *     GSC na „Strona wykryta – obecnie niezindeksowana" (listing renderował
 *     serwerowo 12 kafelków, resztę dociągał fetch po hydracji — patrz
 *     `lib/shop/listing-page-size.ts`).
 *
 * Użycie:
 *   node scripts/verify-seo-indexing.mjs
 *   node scripts/verify-seo-indexing.mjs https://staging.example.com
 *
 * Kod wyjścia 1, gdy cokolwiek jest nie tak — nadaje się do CI.
 */

const BASE = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "https://lumineconcept.pl")
	.trim()
	.replace(/\/+$/, "");

/** Ile stron pobieramy równolegle — dość, by było szybko, mało, by nie dusić serwera. */
const CONCURRENCY = 8;

const GREEN = "\u001b[32m";
const RED = "\u001b[31m";
const YELLOW = "\u001b[33m";
const DIM = "\u001b[2m";
const RESET = "\u001b[0m";

async function fetchText(url) {
	const response = await fetch(url, {
		redirect: "manual",
		headers: { "User-Agent": "lumine-seo-verify" },
	});
	return {
		status: response.status,
		location: response.headers.get("location"),
		body: response.status === 200 ? await response.text() : "",
	};
}

function extractLocs(xml) {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function extractCanonical(html) {
	// Atrybuty bywają w dowolnej kolejności — łapiemy cały tag i z niego href.
	const tag = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
	return tag?.match(/\bhref=["']([^"']+)["']/i)?.[1]?.trim() ?? null;
}

function extractRobots(html) {
	const tag = html.match(/<meta\b[^>]*\bname=["']robots["'][^>]*>/i)?.[0];
	return tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1]?.trim().toLowerCase() ?? null;
}

/** `https://x.pl/a` i `https://x.pl/a/` to ten sam adres — porównujemy znormalizowane. */
function normalize(url) {
	try {
		const parsed = new URL(url);
		return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}${parsed.search}`;
	} catch {
		return url;
	}
}

/**
 * Odnośniki wychodzące ze strony — wyłącznie z surowego `<a href>`, bo dokładnie
 * tyle widzi crawler bez wykonywania JS. Link do samego siebie (breadcrumb
 * bieżącej pozycji) nie liczy się jako link przychodzący.
 */
function extractInternalLinks(html, pageUrl) {
	const origin = new URL(pageUrl).origin;
	const self = normalize(pageUrl);
	const links = new Set();

	for (const [, href] of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
		const raw = href.trim();
		if (!raw || raw.startsWith("#") || /^(mailto|tel|javascript):/i.test(raw)) continue;

		let resolved;
		try {
			resolved = new URL(raw, pageUrl);
		} catch {
			continue;
		}
		if (resolved.origin !== origin) continue;

		const normalized = normalize(resolved.href);
		if (normalized !== self) links.add(normalized);
	}

	return links;
}

async function checkUrl(url) {
	try {
		const { status, location, body } = await fetchText(url);

		if (status !== 200) {
			return { url, level: "error", message: `HTTP ${status}${location ? ` → ${location}` : ""}` };
		}

		// Odnośniki zbieramy z każdej strony, która się otworzyła — także z takiej,
		// która ma własny problem z canonicalem. Dla linkowania liczy się to, czy
		// robot znajdzie adres, nie to, czy strona źródłowa sama jest bez zarzutu.
		const links = extractInternalLinks(body, url);

		const robots = extractRobots(body);
		if (robots?.includes("noindex")) {
			return { url, level: "error", message: `noindex w sitemapie (robots: ${robots})`, links };
		}

		const canonical = extractCanonical(body);
		if (!canonical) {
			return { url, level: "warn", message: "brak tagu canonical", links };
		}
		if (normalize(canonical) !== normalize(url)) {
			return { url, level: "error", message: `canonical → ${canonical}`, links };
		}

		return { url, level: "ok", message: "", links };
	} catch (error) {
		return { url, level: "error", message: `nieudane pobranie: ${error.message}` };
	}
}

/** Prosta pula — `CONCURRENCY` zadań naraz, kolejne startują w miarę zwalniania miejsc. */
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
	const sitemapUrl = `${BASE}/sitemap.xml`;
	process.stdout.write(`${DIM}Pobieram ${sitemapUrl}${RESET}\n`);

	const sitemap = await fetchText(sitemapUrl);
	if (sitemap.status !== 200) {
		process.stderr.write(`${RED}sitemap.xml zwrócił HTTP ${sitemap.status}${RESET}\n`);
		process.exit(1);
	}

	const urls = extractLocs(sitemap.body);
	if (urls.length === 0) {
		process.stderr.write(`${RED}sitemap.xml nie zawiera żadnego <loc>${RESET}\n`);
		process.exit(1);
	}

	const products = urls.filter((u) => /\/sklep\/[^/]+\/[^/]+$/.test(u));
	process.stdout.write(
		`${DIM}${urls.length} URL-i w sitemapie (w tym ${products.length} na ścieżkach produktowych)${RESET}\n\n`,
	);

	const results = await mapWithConcurrency(urls, checkUrl);

	const errors = results.filter((r) => r.level === "error");
	const warnings = results.filter((r) => r.level === "warn");

	for (const { url, level, message } of [...errors, ...warnings]) {
		const color = level === "error" ? RED : YELLOW;
		const label = level === "error" ? "BŁĄD" : "UWAGA";
		process.stdout.write(`${color}${label}${RESET}  ${url}\n        ${message}\n`);
	}

	const ok = results.length - errors.length - warnings.length;
	process.stdout.write(
		`\n${GREEN}${ok} OK${RESET} · ${YELLOW}${warnings.length} uwag${RESET} · ${RED}${errors.length} błędów${RESET}\n`,
	);

	// Sieroty — produkt bez ANI JEDNEGO `<a href>` w HTML całego serwisu.
	// Google zna wtedy adres tylko z sitemapy i skanuje go z najniższym
	// priorytetem; w GSC wygląda to jak „wykryta – obecnie niezindeksowana".
	const incomingLinks = new Map(products.map((url) => [normalize(url), 0]));
	for (const { links } of results) {
		if (!links) continue;
		for (const link of links) {
			const current = incomingLinks.get(link);
			if (current !== undefined) incomingLinks.set(link, current + 1);
		}
	}

	const orphans = [...incomingLinks]
		.filter(([, count]) => count === 0)
		.map(([url]) => url)
		.sort();

	process.stdout.write(`\n${DIM}Linkowanie wewnętrzne (tylko <a href> w HTML, bez JS):${RESET}\n`);
	if (orphans.length === 0) {
		process.stdout.write(
			`  ${GREEN}${products.length}/${products.length} produktów ma link wewnętrzny${RESET}\n`,
		);
	} else {
		process.stdout.write(
			`  ${RED}${orphans.length} z ${products.length} produktów bez linku wewnętrznego${RESET}\n`,
		);
		for (const url of orphans) {
			process.stdout.write(`  ${RED}SIEROTA${RESET}  ${url}\n`);
		}
		process.stdout.write(
			`  ${DIM}Najczęstsza przyczyna: kategoria większa niż LISTING_INITIAL_PAGE_SIZE${RESET}\n`,
		);
	}

	// Rozbicie po kategoriach — szybka odpowiedź na „czy certyfikaty w ogóle są".
	const byPrefix = new Map();
	for (const url of urls) {
		const prefix = new URL(url).pathname.split("/").slice(0, 3).join("/") || "/";
		byPrefix.set(prefix, (byPrefix.get(prefix) ?? 0) + 1);
	}
	process.stdout.write(`\n${DIM}URL-e wg ścieżki:${RESET}\n`);
	for (const [prefix, count] of [...byPrefix].sort((a, b) => b[1] - a[1])) {
		process.stdout.write(`  ${String(count).padStart(4)}  ${prefix}\n`);
	}

	process.exit(errors.length > 0 || orphans.length > 0 ? 1 : 0);
}

main().catch((error) => {
	process.stderr.write(`${RED}${error.stack ?? error}${RESET}\n`);
	process.exit(1);
});
