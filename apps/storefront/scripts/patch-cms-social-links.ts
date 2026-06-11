/**
 * Aktualizuje linki social media w Medusa (`magazyn_site_settings`).
 *
 * Uruchomienie (z apps/storefront):
 *   pnpm exec tsx scripts/patch-cms-social-links.ts
 *   pnpm exec tsx scripts/patch-cms-social-links.ts --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { MAGAZYN_SITE_SETTINGS_KEY } from "../lib/content/metadata-keys";
import { parseSiteSettings, siteSettingsSchema } from "../lib/content/parsers";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = resolve(import.meta.dirname ?? __dirname, "..");

const TARGET_SOCIAL = {
	instagram: "https://www.instagram.com/lumine.concept/",
	facebook: "https://www.facebook.com/profile.php?id=100063769314849",
} as const;

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

async function main() {
	const token = await adminLogin();
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

	const rawSettings = store.metadata?.[MAGAZYN_SITE_SETTINGS_KEY];
	const current = parseSiteSettings(typeof rawSettings === "string" ? rawSettings : rawSettings);

	const next = siteSettingsSchema.parse({
		...current,
		socialLinks: {
			...current.socialLinks,
			...TARGET_SOCIAL,
		},
	});

	console.log("Obecne socialLinks:", current.socialLinks);
	console.log("Nowe socialLinks:", next.socialLinks);

	if (DRY_RUN) {
		console.log("Dry-run — bez zapisu do Medusa.");
		return;
	}

	const metadata = {
		...(store.metadata ?? {}),
		[MAGAZYN_SITE_SETTINGS_KEY]: JSON.stringify(next),
	};

	const patchRes = await fetch(`${backendUrl}/admin/stores/${store.id}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ metadata }),
		signal: AbortSignal.timeout(15_000),
	});

	if (!patchRes.ok) {
		const body = await patchRes.text();
		throw new Error(`Store update failed: ${patchRes.status} ${body}`);
	}

	console.log("Zapisano linki social media w CMS (magazyn_site_settings).");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
