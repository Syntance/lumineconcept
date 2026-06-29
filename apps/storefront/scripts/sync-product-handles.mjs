#!/usr/bin/env node
/**
 * Jednorazowa / awaryjna synchronizacja slugów produktów w Medusie.
 * Użycie: node scripts/sync-product-handles.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");

function loadEnv() {
	const raw = readFileSync(envPath, "utf8");
	const env = {};
	for (const line of raw.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq);
		let val = trimmed.slice(eq + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		env[key] = val;
	}
	return env;
}

const POLISH_MAP = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };

function slugify(input) {
	const base = input
		.toLowerCase()
		.trim()
		.replace(/[ąćęłńóśźż]/g, (char) => POLISH_MAP[char] ?? char)
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80)
		.replace(/-+$/g, "");
	return base || `item-${Date.now()}`;
}

function stripCopySuffix(title) {
	return title.trim().replace(/\s*\(kopia\)\s*$/i, "").trim();
}

function slugifyTitle(title) {
	return slugify(stripCopySuffix(title));
}

function allocateHandles(products) {
	const sorted = [...products].sort((a, b) => {
		const ta = a.created_at ?? "";
		const tb = b.created_at ?? "";
		if (ta !== tb) return ta.localeCompare(tb);
		return a.id.localeCompare(b.id);
	});
	const used = new Set();
	const result = new Map();
	for (const p of sorted) {
		const base = slugifyTitle(p.title);
		let candidate = base;
		let suffix = 2;
		while (used.has(candidate)) {
			candidate = `${base}-${suffix}`;
			suffix += 1;
		}
		used.add(candidate);
		result.set(p.id, candidate);
	}
	return result;
}

function resolveEmail(email) {
	const n = email.trim().toLowerCase();
	return n === "lumine.strona@gmail.com" ? "lumie.strona@gmail.com" : email.trim();
}

async function main() {
	const env = loadEnv();
	const backend = (env.MEDUSA_BACKEND_URL || env.NEXT_PUBLIC_MEDUSA_BACKEND_URL).replace(/\/$/, "");
	const email = resolveEmail(env.MEDUSA_ADMIN_EMAIL);
	const password = env.MEDUSA_ADMIN_PASSWORD;

	const authRes = await fetch(`${backend}/auth/user/emailpass`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	const auth = await authRes.json();
	if (!auth.token) {
		console.error("Auth failed:", auth);
		process.exit(1);
	}
	const token = auth.token;

	const products = [];
	const limit = 100;
	let offset = 0;
	for (;;) {
		const res = await fetch(
			`${backend}/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,created_at`,
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		const data = await res.json();
		const batch = data.products ?? [];
		products.push(...batch);
		if (batch.length < limit) break;
		offset += limit;
	}

	console.log(`Produktów: ${products.length}`);

	const targets = allocateHandles(products);
	const updates = [];
	for (const p of products) {
		const next = targets.get(p.id);
		if (p.handle.trim() === next) continue;
		updates.push({ id: p.id, from: p.handle, to: next, title: p.title });
	}

	console.log(`Do aktualizacji: ${updates.length}`);
	for (const u of updates) {
		const res = await fetch(`${backend}/admin/products/${u.id}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ handle: u.to }),
		});
		if (!res.ok) {
			const err = await res.text();
			console.error(`FAIL ${u.from} → ${u.to}:`, err.slice(0, 200));
		} else {
			console.log(`OK  ${u.from} → ${u.to}  (${u.title.slice(0, 40)})`);
		}
	}

	console.log("Gotowe.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
