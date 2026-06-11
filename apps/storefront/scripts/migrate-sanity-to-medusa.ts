/**
 * Jednorazowa migracja treści Sanity → Medusa Store.metadata + product.metadata.
 *
 * Uruchomienie (z katalogu apps/storefront):
 *   pnpm exec tsx scripts/migrate-sanity-to-medusa.ts
 *   pnpm exec tsx scripts/migrate-sanity-to-medusa.ts --dry-run
 *
 * Wymaga: NEXT_PUBLIC_SANITY_*, SANITY_API_TOKEN, MEDUSA_ADMIN_* w .env.local
 */
import { createClient } from "@sanity/client";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
	mapGlobalContentToMetadata,
	mapPageContentFromSanity,
	mapProductFaqsByHandle,
	mapSiteSettingsToMetadata,
} from "./migrate-sanity-mapper";

const DRY_RUN = process.argv.includes("--dry-run");

function loadEnvLocal() {
	const envPath = resolve(process.cwd(), ".env.local");
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

const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "");
const adminEmail = process.env.MEDUSA_ADMIN_EMAIL;
const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD;

async function adminLogin(): Promise<string> {
	if (!adminEmail || !adminPassword) throw new Error("Brak MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD");
	const res = await fetch(`${backendUrl}/auth/user/emailpass`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: adminEmail, password: adminPassword }),
	});
	if (!res.ok) throw new Error(`Login failed: ${res.status}`);
	const data = (await res.json()) as { token?: string };
	if (!data.token) throw new Error("Brak tokenu");
	return data.token;
}

async function adminFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${backendUrl}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});
	if (!res.ok) throw new Error(`Admin ${path}: ${res.status}`);
	return (await res.json()) as T;
}

async function rehostImage(token: string, url: string | undefined | null): Promise<string | undefined> {
	if (!url) return undefined;
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
		if (!res.ok) return url;
		const blob = await res.blob();
		const form = new FormData();
		form.append("files", new File([blob], "migrated.webp", { type: blob.type || "image/webp" }));
		const uploadRes = await fetch(`${backendUrl}/admin/uploads`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: form,
		});
		if (!uploadRes.ok) return url;
		const data = (await uploadRes.json()) as { files?: Array<{ url?: string }> };
		return data.files?.[0]?.url ?? url;
	} catch {
		return url;
	}
}

async function main() {
	const sanity = createClient({
		projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
		dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
		apiVersion: "2026-03-22",
		token: process.env.SANITY_API_TOKEN,
		useCdn: false,
	});

	const siteSettings = await sanity.fetch(`*[_type == "siteSettings"][0]`);
	const testimonials = await sanity.fetch(`*[_type == "testimonial"] | order(order asc)`);
	const faqs = await sanity.fetch(`*[_type == "faq"] | order(order asc)`);
	const salonLogos = await sanity.fetch(`*[_type == "salonLogo"] | order(order asc)`);
	const productFaqs = await sanity.fetch(`*[_type == "productFaq"] | order(order asc)`);
	const gallery = await sanity.fetch(`*[_type == "realizationGallery"][0]`);

	console.log("[migrate] Sanity loaded:", {
		siteSettings: Boolean(siteSettings),
		testimonials: testimonials?.length ?? 0,
		faqs: faqs?.length ?? 0,
		salonLogos: salonLogos?.length ?? 0,
		productFaqs: productFaqs?.length ?? 0,
		galleryPhotos: gallery?.photos?.length ?? 0,
	});

	if (DRY_RUN) {
		console.log("[migrate] --dry-run — pomijam zapis do Medusa");
		return;
	}

	const token = await adminLogin();
	const storeRes = await adminFetch<{ stores: Array<{ id: string; metadata?: Record<string, unknown> }> }>(
		token,
		"/admin/stores?limit=1&fields=id,metadata",
	);
	const store = storeRes.stores[0];
	if (!store) throw new Error("Brak sklepu");

	const defaultOg = await rehostImage(token, siteSettings?.defaultOgImage?.asset?.url);
	const globalSeoOg = await rehostImage(token, siteSettings?.seo?.ogImage?.asset?.url);

	const instagramTiles = await Promise.all(
		(siteSettings?.homepageInstagramPosts ?? []).map(async (row: { _key: string; postUrl: string; alt?: string; image?: { asset?: { url?: string } } }) => ({
			_key: row._key,
			postUrl: row.postUrl,
			alt: row.alt,
			imageUrl: (await rehostImage(token, row.image?.asset?.url)) ?? "",
		})),
	);

	const migratedLogos = await Promise.all(
		(salonLogos ?? []).map(async (logo: { _id: string; name: string; order: number; logo?: { asset?: { url?: string } } }) => ({
			_id: logo._id,
			name: logo.name,
			order: logo.order ?? 0,
			logoUrl: await rehostImage(token, logo.logo?.asset?.url),
		})),
	);

	const pageContent = mapPageContentFromSanity({
		testimonials: await Promise.all(
			(testimonials ?? []).map(async (t: { _id: string; page: string; name: string; role?: string; company: string; quote: string; rating: number; order?: number; image?: { asset?: { url?: string } } }) => ({
				_id: t._id,
				page: t.page,
				name: t.name,
				role: t.role,
				company: t.company,
				quote: t.quote,
				rating: t.rating ?? 5,
				order: t.order ?? 0,
				imageUrl: await rehostImage(token, t.image?.asset?.url),
			})),
		),
		faqs: (faqs ?? []).map((f: { _id: string; page: string; question: string; answer: string; order?: number }) => ({
			_id: f._id,
			page: f.page,
			question: f.question,
			answer: f.answer,
			order: f.order ?? 0,
		})),
		galleryPhotos: gallery?.photos?.length
			? await Promise.all(
					gallery.photos.map(async (p: { _key: string; alt?: string; asset?: { url?: string } }) => ({
						_key: p._key,
						alt: p.alt,
						imageUrl: (await rehostImage(token, p.asset?.url)) ?? "",
					})),
				)
			: undefined,
	});

	const magazyn_site_settings = mapSiteSettingsToMetadata({
		title: siteSettings?.title,
		description: siteSettings?.description,
		announcementBar: siteSettings?.announcementBar,
		trustBar: siteSettings?.trustBar,
		checkoutCallout: siteSettings?.checkoutCallout,
		socialLinks: siteSettings?.socialLinks,
		footerText: siteSettings?.footerText,
		titleTemplate: siteSettings?.titleTemplate,
		googleSiteVerification: siteSettings?.googleSiteVerification,
		defaultOgImageUrl: defaultOg,
		seo: siteSettings?.seo
			? {
					metaTitle: siteSettings.seo.metaTitle,
					metaDescription: siteSettings.seo.metaDescription,
					ogTitle: siteSettings.seo.ogTitle,
					ogDescription: siteSettings.seo.ogDescription,
					ogImageUrl: globalSeoOg,
					canonicalUrl: siteSettings.seo.canonicalUrl,
					noIndex: siteSettings.seo.noIndex,
					noFollow: siteSettings.seo.noFollow,
				}
			: undefined,
	});

	const magazyn_global_content = mapGlobalContentToMetadata({
		salonLogos: migratedLogos,
		instagramTiles,
	});

	const magazyn_page_content = JSON.stringify(pageContent);

	await adminFetch(token, `/admin/stores/${store.id}`, {
		method: "POST",
		body: JSON.stringify({
			metadata: {
				...(store.metadata ?? {}),
				magazyn_site_settings,
				magazyn_global_content,
				magazyn_page_content,
			},
		}),
	});

	// Product FAQs
	const productsRes = await adminFetch<{ products: Array<{ id: string; handle: string; metadata?: Record<string, unknown> }> }>(
		token,
		"/admin/products?limit=200&fields=id,handle,metadata",
	);
	const byHandle = new Map(productsRes.products.map((p) => [p.handle, p]));

	const faqsByHandle = mapProductFaqsByHandle(
		(productFaqs ?? []).map((pf: { _id: string; productHandle?: string; question: string; answer: string; order?: number }) => ({
			_id: pf._id,
			productHandle: pf.productHandle,
			question: pf.question,
			answer: pf.answer,
			order: pf.order,
		})),
	);

	for (const [handle, faqList] of faqsByHandle) {
		const product = byHandle.get(handle);
		if (!product) continue;
		await adminFetch(token, `/admin/products/${product.id}`, {
			method: "POST",
			body: JSON.stringify({
				metadata: {
					...(product.metadata ?? {}),
					product_faq: JSON.stringify(faqList.sort((a, b) => a.order - b.order)),
				},
			}),
		});
	}

	console.log("[migrate] Zakończono migrację do Medusa.");
}

main().catch((err) => {
	console.error("[migrate] Błąd:", err);
	process.exit(1);
});
