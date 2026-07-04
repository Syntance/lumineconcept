/**
 * Wgrywa obrazy hero/branding do R2 (cms-uploads) i zapisuje URL-e w Medusa pageContent.
 *
 * Uruchomienie (z apps/storefront):
 *   pnpm exec tsx scripts/seed-cms-hero-images.ts
 *   pnpm exec tsx scripts/seed-cms-hero-images.ts --dry-run
 *
 * Wymaga: S3_* (R2) lub MEDUSA_ADMIN_* + backend z uploadami.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, basename } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MAGAZYN_PAGE_CONTENT_KEY } from "../lib/content/metadata-keys";
import { parsePageContentMap, preparePageContentForSave } from "../lib/content/parsers";
import type { PageContentMap } from "../lib/content/types";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = resolve(import.meta.dirname ?? __dirname, "..");

function loadEnvLocal() {
	const envPath = resolve(ROOT, ".env.local");
	if (!existsSync(envPath)) return;
	const raw = readFileSync(envPath, "utf8");
	for (const line of raw.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq <= 0) continue;
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		if (!process.env[key]) process.env[key] = value;
	}
}

loadEnvLocal();

const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "");
const adminEmail = process.env.MEDUSA_ADMIN_EMAIL;
const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD;

const MIME: Record<string, string> = {
	webp: "image/webp",
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
};

type SeedAsset = {
	label: string;
	file: string;
	apply: (content: PageContentMap, url: string) => void;
};

const SEED_ASSETS: SeedAsset[] = [
	{
		label: "Home hero desktop",
		file: "public/images/hero-main-wall.webp",
		apply: (map, url) => {
			const home = map.home ?? {};
			map.home = {
				...home,
				hero: { ...(home.hero ?? { headline: "CONCEPT", description: "", ctaLabel: "", ctaHref: "" }), desktopImageUrl: url },
			};
		},
	},
	{
		label: "Home hero mobile",
		file: "public/images/hero-main-wall-mobile.webp",
		apply: (map, url) => {
			const home = map.home ?? {};
			map.home = {
				...home,
				hero: { ...(home.hero ?? { headline: "CONCEPT", description: "", ctaLabel: "", ctaHref: "" }), mobileImageUrl: url },
			};
		},
	},
	{
		label: "Home branding CTA desktop",
		file: "public/images/monia-branding-cta-bg.webp",
		apply: (map, url) => {
			const home = map.home ?? {};
			map.home = {
				...home,
				brandingCta: { desktopBackgroundUrl: url },
			};
		},
	},
	{
		label: "Logo-3d hero desktop",
		file: "public/images/categories/logo-hero-bg.png",
		apply: (map, url) => {
			const page = map["logo-3d"] ?? {};
			map["logo-3d"] = {
				...page,
				hero: { ...(page.hero ?? { headline: "Tablica z logo", description: "", ctaLabel: "", ctaHref: "" }), desktopImageUrl: url },
			};
		},
	},
	{
		label: "Logo-3d hero mobile",
		file: "public/images/categories/logo-hero-bg.png",
		apply: (map, url) => {
			const page = map["logo-3d"] ?? {};
			map["logo-3d"] = {
				...page,
				hero: { ...(page.hero ?? { headline: "Tablica z logo", description: "", ctaLabel: "", ctaHref: "" }), mobileImageUrl: url },
			};
		},
	},
];

function getR2Config() {
	const endpoint = process.env.S3_ENDPOINT?.trim();
	const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
	const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
	const bucket = process.env.S3_BUCKET?.trim();
	const fileUrl = process.env.S3_FILE_URL?.trim();
	if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !fileUrl) return null;
	return { endpoint, accessKeyId, secretAccessKey, bucket, fileUrl };
}

let cachedR2: S3Client | null = null;

async function uploadToR2(filePath: string): Promise<string> {
	const config = getR2Config();
	if (!config) throw new Error("Brak konfiguracji S3/R2 (S3_ENDPOINT, S3_ACCESS_KEY_ID, …)");

	if (!cachedR2) {
		cachedR2 = new S3Client({
			region: process.env.S3_REGION?.trim() || "auto",
			endpoint: config.endpoint,
			forcePathStyle: true,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		});
	}

	const abs = resolve(ROOT, filePath);
	const bytes = readFileSync(abs);
	const name = basename(filePath);
	const ext = name.split(".").pop()?.toLowerCase() ?? "webp";
	const contentType = MIME[ext] ?? "application/octet-stream";
	const timestamp = Date.now();
	const random = Math.random().toString(36).slice(2, 8);
	const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
	const key = `cms-uploads/${timestamp}-${random}-${safeName}`;

	await cachedR2.send(
		new PutObjectCommand({
			Bucket: config.bucket,
			Key: key,
			Body: bytes,
			ContentType: contentType,
		}),
	);

	const base = config.fileUrl.replace(/\/$/, "");
	return `${base}/${key}`;
}

async function adminLogin(): Promise<string> {
	if (!adminEmail || !adminPassword) throw new Error("Brak MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD");
	const res = await fetch(`${backendUrl}/auth/user/emailpass`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: adminEmail, password: adminPassword }),
		signal: AbortSignal.timeout(15_000),
	});
	if (!res.ok) throw new Error(`Login failed: ${res.status}`);
	const data = (await res.json()) as { token?: string };
	if (!data.token) throw new Error("Brak tokenu");
	return data.token;
}

async function loadCurrentPageContent(token: string): Promise<PageContentMap> {
	const res = await fetch(`${backendUrl}/admin/stores?limit=1&fields=id,metadata`, {
		headers: { Authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(15_000),
	});
	if (!res.ok) throw new Error(`Stores fetch failed: ${res.status}`);
	const data = (await res.json()) as { stores: Array<{ metadata?: Record<string, unknown> }> };
	const raw = data.stores[0]?.metadata?.[MAGAZYN_PAGE_CONTENT_KEY];
	if (typeof raw !== "string") return {};
	return parsePageContentMap(raw);
}

async function savePageContent(token: string, map: PageContentMap): Promise<void> {
	const storeRes = await fetch(`${backendUrl}/admin/stores?limit=1&fields=id,metadata`, {
		headers: { Authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(15_000),
	});
	if (!storeRes.ok) throw new Error(`Stores fetch failed: ${storeRes.status}`);
	const storeData = (await storeRes.json()) as {
		stores: Array<{ id: string; metadata?: Record<string, unknown> }>;
	};
	const store = storeData.stores[0];
	if (!store?.id) throw new Error("Brak sklepu");

	const metadata = { ...(store.metadata ?? {}), [MAGAZYN_PAGE_CONTENT_KEY]: JSON.stringify(map) };
	const patchRes = await fetch(`${backendUrl}/admin/stores/${store.id}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ metadata }),
		signal: AbortSignal.timeout(15_000),
	});
	if (!patchRes.ok) throw new Error(`Store update failed: ${patchRes.status}`);
}

async function main() {
	const token = await adminLogin();
	const map = await loadCurrentPageContent(token);

	for (const asset of SEED_ASSETS) {
		const abs = resolve(ROOT, asset.file);
		if (!existsSync(abs)) {
			console.warn(`⚠ Pominięto (brak pliku): ${asset.file}`);
			continue;
		}
		console.log(`→ ${asset.label}: ${asset.file}`);
		if (DRY_RUN) {
			asset.apply(map, `https://cdn.example/dry-run/${basename(asset.file)}`);
			continue;
		}
		const url = await uploadToR2(asset.file);
		console.log(`  ✓ ${url}`);
		asset.apply(map, url);
	}

	for (const [pageId, content] of Object.entries(map)) {
		if (content) map[pageId as keyof PageContentMap] = preparePageContentForSave(pageId, content);
	}

	if (DRY_RUN) {
		console.log("\n[dry-run] pageContent:", JSON.stringify(map, null, 2));
		return;
	}

	await savePageContent(token, map);
	console.log("\n✓ Zapisano URL-e obrazów w Medusa metadata (magazyn_page_content).");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
