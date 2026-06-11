#!/usr/bin/env tsx
/**
 * Sync CMS → static, uruchamiany w `prebuild` (przed `next build`).
 *
 * 1. Loguje się do Medusa (service account) i czyta Store.metadata.
 * 2. Ściąga WSZYSTKIE zdalne obrazy CMS (R2/CDN) do `/public/images/cms/`.
 * 3. Podmienia URL-e na lokalne ścieżki i zapisuje `lib/content/static-cms-content.ts`.
 *
 * Dzięki temu na produkcji storefront czyta treść i obrazy lokalnie (instant),
 * bez fetchy do Medusy/R2 w runtime. Brak credentials / błąd = no-op (build trwa,
 * runtime spada na dynamiczny fetch + lokalne fallbacki).
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const MEDUSA_URL = (
	process.env.MEDUSA_BACKEND_URL ||
	process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
	"http://localhost:9000"
).replace(/\/$/, "");
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;

const PUBLIC_DIR = path.join(process.cwd(), "public");
const CMS_IMAGES_DIR = path.join(PUBLIC_DIR, "images", "cms");
const STATIC_CONTENT_FILE = path.join(process.cwd(), "lib", "content", "static-cms-content.ts");

/** Klucze JSON w Store.metadata (namespace Magazyn CMS). */
const METADATA_KEYS = [
	"magazyn_site_settings",
	"magazyn_page_seo",
	"magazyn_page_content",
	"magazyn_global_content",
] as const;

/** Alias konta serwisowego (literówka w mailu po stronie Medusy). */
function resolveAdminEmail(email: string): string {
	const normalized = email.trim().toLowerCase();
	if (normalized === "lumine.strona@gmail.com") return "lumie.strona@gmail.com";
	return email.trim();
}

async function getAdminToken(): Promise<string | null> {
	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.warn("⚠ MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD nie ustawione — pomijam sync.");
		return null;
	}

	const res = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: resolveAdminEmail(ADMIN_EMAIL), password: ADMIN_PASSWORD }),
		signal: AbortSignal.timeout(15_000),
	});

	if (!res.ok) {
		throw new Error(`Auth failed: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as { token?: string };
	if (!data.token) throw new Error("Brak tokenu w odpowiedzi /auth/user/emailpass");
	return data.token;
}

async function fetchStoreMetadata(token: string): Promise<Record<string, unknown>> {
	const res = await fetch(`${MEDUSA_URL}/admin/stores?limit=1&fields=id,metadata`, {
		headers: { Authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(30_000),
	});

	if (!res.ok) {
		throw new Error(`Store fetch failed: ${res.status} ${res.statusText}`);
	}

	const data = (await res.json()) as {
		stores?: Array<{ metadata?: Record<string, unknown> | null }>;
	};
	return data.stores?.[0]?.metadata ?? {};
}

/** Metadata trzyma wartości jako JSON-stringi — parsujemy do obiektów. */
function parseMaybeJson(value: unknown): unknown {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

function isRemoteImageUrl(value: string): boolean {
	return /^https?:\/\//i.test(value) && IMAGE_EXT.test(value.split("?")[0] ?? "");
}

function collectRemoteImageUrls(node: unknown, acc: Set<string>): void {
	if (typeof node === "string") {
		if (isRemoteImageUrl(node)) acc.add(node);
	} else if (Array.isArray(node)) {
		for (const item of node) collectRemoteImageUrls(item, acc);
	} else if (node && typeof node === "object") {
		for (const val of Object.values(node)) collectRemoteImageUrls(val, acc);
	}
}

/** Stabilna, bezkolizyjna nazwa pliku: <hash8>-<oryginalna-nazwa>. */
function localFilenameFor(url: string): string {
	const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 8);
	let base = "asset";
	try {
		base = path.basename(new URL(url).pathname) || "asset";
	} catch {
		/* keep default */
	}
	return `${hash}-${base}`;
}

async function downloadImage(url: string, filename: string): Promise<boolean> {
	const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
	if (!res.ok || !res.body) {
		console.warn(`    ⚠ pominięto (HTTP ${res.status}): ${url}`);
		return false;
	}
	const filepath = path.join(CMS_IMAGES_DIR, filename);
	await pipeline(Readable.fromWeb(res.body as never), fs.createWriteStream(filepath));
	return true;
}

async function downloadAllImages(parsed: Record<string, unknown>): Promise<Map<string, string>> {
	const urls = new Set<string>();
	collectRemoteImageUrls(parsed, urls);

	console.log(`\n📦 Znaleziono ${urls.size} zdalnych obrazów CMS`);
	fs.mkdirSync(CMS_IMAGES_DIR, { recursive: true });

	const urlMap = new Map<string, string>();
	for (const url of urls) {
		const filename = localFilenameFor(url);
		console.log(`  → ${filename}`);
		const ok = await downloadImage(url, filename);
		if (ok) urlMap.set(url, `/images/cms/${filename}`);
	}
	return urlMap;
}

function replaceImageUrls(node: unknown, urlMap: Map<string, string>): unknown {
	if (typeof node === "string") return urlMap.get(node) ?? node;
	if (Array.isArray(node)) return node.map((item) => replaceImageUrls(item, urlMap));
	if (node && typeof node === "object") {
		const out: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(node)) out[key] = replaceImageUrls(val, urlMap);
		return out;
	}
	return node;
}

function generateStaticContentFile(localized: Record<string, unknown>): void {
	const content = `// Auto-generated by scripts/sync-cms-to-static.ts
// DO NOT EDIT MANUALLY — regenerowane przy każdym buildzie (prebuild).

export const STATIC_CMS_CONTENT = ${JSON.stringify(localized, null, 2)} as const;

export type StaticCmsContent = typeof STATIC_CMS_CONTENT;
`;
	fs.writeFileSync(STATIC_CONTENT_FILE, content, "utf-8");
	console.log(`\n✓ Zapisano ${path.relative(process.cwd(), STATIC_CONTENT_FILE)}`);
}

async function main() {
	console.log("🚀 Sync CMS → static...\n");

	try {
		const token = await getAdminToken();
		if (!token) {
			console.log("⚠ Sync pominięty — produkcja użyje dynamicznego fetcha + lokalnych fallbacków.\n");
			process.exit(0);
		}

		const rawMetadata = await fetchStoreMetadata(token);

		// Parsujemy tylko znane klucze CMS do obiektów (reszta nieistotna dla storefrontu).
		const parsed: Record<string, unknown> = {};
		for (const key of METADATA_KEYS) {
			if (rawMetadata[key] !== undefined) parsed[key] = parseMaybeJson(rawMetadata[key]);
		}

		const urlMap = await downloadAllImages(parsed);
		const localized = replaceImageUrls(parsed, urlMap) as Record<string, unknown>;

		generateStaticContentFile(localized);

		console.log(`\n✨ Sync zakończony — ${urlMap.size} obrazów zlokalizowanych. PageSpeed ready 🚀\n`);
	} catch (error) {
		console.error("\n❌ Sync nieudany:", error);
		console.error("⚠ Build kontynuuje — runtime spadnie na dynamiczny fetch.\n");
		process.exit(0); // nie wywalaj buildu
	}
}

main();
