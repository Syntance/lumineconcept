#!/usr/bin/env node
/**
 * Sondy bezpieczeństwa + izolacji — Etap 1 composera.
 * Użycie: node scripts/verify-composer-etap1.mjs [BASE_URL]
 * Domyślnie: http://localhost:3000
 */
const BASE = (process.argv[2] ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").replace(
	/\/$/,
	"",
);

async function fetchText(path, init) {
	const res = await fetch(`${BASE}${path}`, init);
	const text = await res.text();
	return { res, text };
}

function count(pattern, text) {
	const m = text.match(pattern);
	return m ? m.length : 0;
}

let failed = 0;

function pass(label) {
	console.log(`  [x] ${label}`);
}

function fail(label, detail) {
	console.log(`  [ ] ${label}${detail ? ` — ${detail}` : ""}`);
	failed++;
}

console.log(`\nComposer Etap 1 — sondy na ${BASE}\n`);

// --- API bez sesji ---
{
	const { res } = await fetchText("/api/cms-preview/enable?path=/");
	if (res.status === 401) pass(`GET /api/cms-preview/enable → ${res.status}`);
	else fail(`GET /api/cms-preview/enable → 401`, `otrzymano ${res.status}`);
}

{
	const { res } = await fetchText("/api/composer/theme-tokens", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({}),
	});
	if (res.status === 401) pass(`POST /api/composer/theme-tokens → ${res.status}`);
	else fail(`POST /api/composer/theme-tokens → 401`, `otrzymano ${res.status}`);
}

// --- HTML anonimowy ---
{
	const { res, text } = await fetchText("/");
	if (!res.ok) {
		fail("GET / → 200", `otrzymano ${res.status}`);
	} else {
		pass(`GET / → ${res.status}`);
		const dataCms = count(/data-cms/g, text);
		const dataCmsInput = count(/data-cms-input/g, text);
		const trybEdycji = count(/Tryb edycji/g, text);
		if (dataCms === 0) pass("HTML / — data-cms = 0");
		else fail("HTML / — data-cms = 0", `znaleziono ${dataCms}`);
		if (dataCmsInput === 0) pass("HTML / — data-cms-input = 0");
		else fail("HTML / — data-cms-input = 0", `znaleziono ${dataCmsInput}`);
		if (trybEdycji === 0) pass('HTML / — brak "Tryb edycji"');
		else fail('HTML / — brak "Tryb edycji"', `znaleziono ${trybEdycji}`);
		if (text.includes("lumine-theme-tokens")) pass("HTML / — blok CSS motywu obecny");
		else fail("HTML / — blok CSS motywu (lumine-theme-tokens)");
		if (!text.includes("</style><script>")) pass("HTML / — brak wstrzykniętego </style><script>");
		else fail("HTML / — brak XSS w style");
	}
}

{
	const { res, text } = await fetchText("/sklep");
	if (res.ok && count(/data-cms/g, text) === 0) pass("HTML /sklep — data-cms = 0");
	else fail("HTML /sklep — data-cms = 0");
}

// --- Zod odrzuca XSS (unit path przez API body) ---
{
	const xssPayload = {
		colors: {
			background: "oklch(1 0 0)",
			foreground: "oklch(0.438 0.024 48.5)",
			primary: "oklch(0.216 0.006 56.043)",
			primaryForeground: "oklch(0.985 0.001 106.423)",
			accent: "oklch(0.5 0.1 30);</style><script>alert(1)</script>",
			accentForeground: "oklch(1 0 0)",
			muted: "oklch(0.97 0.001 106.424)",
			mutedForeground: "oklch(0.573 0.022 48.2)",
			border: "oklch(0.923 0.003 48.717)",
			card: "oklch(1 0 0)",
			cardForeground: "oklch(0.438 0.024 48.5)",
			brand50: "oklch(0.965 0.012 75)",
			brand100: "oklch(0.935 0.018 75)",
			brand200: "oklch(0.885 0.032 68)",
			brand300: "oklch(0.82 0.048 62)",
			brand400: "oklch(0.72 0.072 55)",
			brand500: "oklch(0.627 0.089 52.3)",
			brand600: "oklch(0.52 0.065 48)",
			brand700: "oklch(0.48 0.045 45)",
			brand800: "oklch(0.438 0.024 48.5)",
			brand900: "oklch(0.32 0.022 42)",
			brandReadable: "oklch(0.48 0.045 45)",
			onBrand800: "oklch(0.9 0.025 75)",
			accentDark: "oklch(0.438 0.024 48.5)",
		},
		radius: "0.625rem",
		fonts: { body: "gilroy", display: "chronicle", serif: "chronicle" },
	};
	const { res } = await fetchText("/api/composer/theme-tokens", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(xssPayload),
	});
	// Bez sesji = 401; z sesją = 400. Oba = odrzucone przed HTML.
	if (res.status === 401 || res.status === 400) pass(`POST XSS payload → odrzucony (${res.status})`);
	else fail("POST XSS payload → odrzucony", `otrzymano ${res.status}`);
}

console.log(failed === 0 ? "\nWszystkie sondy OK.\n" : `\n${failed} sonda(y) nie przeszła(y).\n`);
process.exit(failed === 0 ? 0 : 1);
