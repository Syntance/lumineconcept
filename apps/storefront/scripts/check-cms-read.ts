/**
 * Diagnostyka odczytu CMS (Store.metadata) — uruchom: pnpm exec tsx scripts/check-cms-read.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname ?? __dirname, "..");

function loadEnvLocal() {
	const envPath = resolve(ROOT, ".env.local");
	if (!existsSync(envPath)) return;
	for (const line of readFileSync(envPath, "utf8").split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq <= 0) continue;
		const key = trimmed.slice(0, eq).trim();
		let value = trimmed.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!process.env[key]) process.env[key] = value;
	}
}

loadEnvLocal();

async function main() {
	const backend = (
		process.env.MEDUSA_BACKEND_URL ??
		process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
		""
	).replace(/\/$/, "");
	const emailRaw = process.env.MEDUSA_ADMIN_EMAIL?.trim();
	const password = process.env.MEDUSA_ADMIN_PASSWORD?.trim();
	const resolvedEmail = emailRaw;

	console.log("Backend:", backend || "(brak)");
	console.log("Admin email (env):", emailRaw ? "ustawiony" : "BRAK");
	console.log("Admin email (login):", resolvedEmail ? "ustawiony" : "BRAK");
	console.log("Admin password:", password ? "ustawiony" : "BRAK");
	console.log("S3_FILE_URL:", process.env.S3_FILE_URL ? "ustawiony" : "BRAK");
	console.log(
		"NEXT_PUBLIC_S3_FILE_URL:",
		process.env.NEXT_PUBLIC_S3_FILE_URL ? "ustawiony" : "BRAK",
	);

	if (!backend || !resolvedEmail || !password) {
		console.log("\n❌ Brakuje wymaganych zmiennych do odczytu CMS.");
		process.exit(1);
	}

	const authRes = await fetch(`${backend}/auth/user/emailpass`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: resolvedEmail, password }),
		signal: AbortSignal.timeout(15_000),
	});
	console.log("\nAuth status:", authRes.status, authRes.status === 200 ? "OK" : "FAIL");

	if (!authRes.ok) {
		console.log("❌ Logowanie admina nie działa — localhost nie pobierze CMS (401 = złe hasło).");
		process.exit(1);
	}

	const { token } = (await authRes.json()) as { token?: string };
	const storesRes = await fetch(`${backend}/admin/stores?limit=1&fields=id,metadata`, {
		headers: { Authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(15_000),
	});
	console.log("Stores metadata status:", storesRes.status);

	if (!storesRes.ok) {
		console.log("❌ Nie udało się odczytać Store.metadata.");
		process.exit(1);
	}

	const data = (await storesRes.json()) as {
		stores: Array<{ metadata?: Record<string, unknown> | null }>;
	};
	const raw = data.stores[0]?.metadata?.magazyn_page_content;
	const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
	const homeHero = parsed?.home?.hero as
		| { desktopImageUrl?: string; mobileImageUrl?: string }
		| undefined;

	console.log("\nHome hero z CMS:");
	console.log("  desktopImageUrl:", homeHero?.desktopImageUrl ?? "(brak)");
	console.log("  mobileImageUrl:", homeHero?.mobileImageUrl ?? "(brak)");

	for (const label of ["desktopImageUrl", "mobileImageUrl"] as const) {
		const url = homeHero?.[label];
		if (!url) continue;
		try {
			const head = await fetch(url, {
				method: "HEAD",
				signal: AbortSignal.timeout(10_000),
			});
			console.log(`  ${label} HTTP:`, head.status, head.ok ? "OK" : "FAIL");
		} catch (e) {
			console.log(`  ${label} HTTP:`, "ERROR", e instanceof Error ? e.message : e);
		}
	}

	if (!process.env.NEXT_PUBLIC_S3_FILE_URL && process.env.S3_FILE_URL) {
		console.log(
			"\n⚠️  Brak NEXT_PUBLIC_S3_FILE_URL — dodaj tę samą wartość co S3_FILE_URL (next/image + CSP na prod/dev).",
		);
	}

	console.log("\n✅ CMS odczyt działa — localhost powinien pokazywać te same URL-e co produkcja.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
