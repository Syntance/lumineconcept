import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Strażnik źródłowy, nie renderujący.
 *
 * Metadane Next dziedziczą się po segmentach trasy. Dopóki root layout
 * ustawiał `alternates.canonical`, każda podstrona, która zapomniała własnego
 * canonicala, kanonizowała się na stronę główną — i wypadała z indeksu mimo
 * obecności w sitemapie (tak stało się z `/deklaracja-dostepnosci`).
 * Root layout już go nie ustawia, więc brakujący canonical nie jest dziś
 * groźny, ale strona bez canonicala i tak jest błędem, którego nie chcemy
 * odkrywać dopiero w Search Console.
 *
 * Reguła: każda strona w `(shop)` albo deklaruje canonical (sama lub przez
 * moduł, któremu deleguje metadane), albo jest wyłączona z indeksu (sama lub
 * przez layout nad sobą), albo jest samym przekierowaniem.
 */

const STOREFRONT_ROOT = path.resolve(__dirname, "../..");
const SHOP_DIR = path.join(STOREFRONT_ROOT, "app/(shop)");

function collectPageFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = path.join(dir, entry);
		if (statSync(full).isDirectory()) {
			out.push(...collectPageFiles(full));
		} else if (entry === "page.tsx" || entry === "page.ts") {
			out.push(full);
		}
	}
	return out;
}

/** Rozwiązuje `@/...` i `./...` do pliku w repo; `null` dla paczek z node_modules. */
function resolveLocalImport(spec: string, importerDir: string): string | null {
	let base: string;
	if (spec.startsWith("@/")) base = path.join(STOREFRONT_ROOT, spec.slice(2));
	else if (spec.startsWith(".")) base = path.resolve(importerDir, spec);
	else return null;

	for (const candidate of [`${base}.tsx`, `${base}.ts`, path.join(base, "index.ts")]) {
		if (existsSync(candidate)) return candidate;
	}
	return null;
}

/**
 * Źródło strony + źródła modułów, którym deleguje metadane (jeden poziom).
 * `/sklep/certyfikaty/[slug]` to samo `createProductPage(...)`, a canonical
 * siedzi w fabryce — bez tego kroku test widziałby fałszywy brak.
 */
function sourceWithDelegates(file: string): string {
	const source = readFileSync(file, "utf-8");
	const dir = path.dirname(file);
	const specs = [...source.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]!);

	const delegated = specs
		.map((spec) => resolveLocalImport(spec, dir))
		.filter((f): f is string => Boolean(f))
		.map((f) => readFileSync(f, "utf-8"));

	return [source, ...delegated].join("\n");
}

/** `noindex` odziedziczony z dowolnego layoutu nad stroną (np. `/checkout`). */
function ancestorLayoutNoIndex(file: string): boolean {
	let dir = path.dirname(file);
	while (dir.startsWith(SHOP_DIR)) {
		const layout = path.join(dir, "layout.tsx");
		if (existsSync(layout) && /index:\s*false/.test(readFileSync(layout, "utf-8"))) {
			return true;
		}
		dir = path.dirname(dir);
	}
	return false;
}

const pages = collectPageFiles(SHOP_DIR).map((file) => ({
	file,
	route: `/${path.relative(SHOP_DIR, path.dirname(file))}`.replace(/\/\.$/, "/"),
	source: sourceWithDelegates(file),
	inheritsNoIndex: ancestorLayoutNoIndex(file),
}));

describe("canonical na stronach sklepu", () => {
	it("znajduje strony do sprawdzenia", () => {
		expect(pages.length).toBeGreaterThan(10);
	});

	it.each(pages.map((p) => [p.route, p] as const))(
		"%s deklaruje canonical, noindex albo redirect",
		(_route, page) => {
			const { source, inheritsNoIndex } = page;

			const declaresCanonical = /canonical/.test(source);
			// `buildMetadata({ path })` sam składa canonical z SITE_URL + path.
			// Skrót `path,` liczy się tak samo jak `path: ...`.
			const feedsBuildMetadataPath =
				source.includes("buildMetadata") && /\bpath\s*[,:}]/.test(source);
			const isNoIndex = /index:\s*false/.test(source) || inheritsNoIndex;
			const isRedirect = /permanentRedirect|redirect\(/.test(source);

			expect(
				declaresCanonical || feedsBuildMetadataPath || isNoIndex || isRedirect,
			).toBe(true);
		},
	);
});
