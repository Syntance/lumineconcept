import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import { serverEnv } from "@magazyn/core/env";
import { loginWithEmailPassword } from "@magazyn/core/medusa/client";
import { isLocalCmsDirectMediaEnabled } from "./cms-media-gate";
import {
	MAGAZYN_GLOBAL_CONTENT_KEY,
	MAGAZYN_PAGE_CONTENT_KEY,
	MAGAZYN_PAGE_SEO_KEY,
	MAGAZYN_SITE_SETTINGS_KEY,
	MAGAZYN_THEME_TOKENS_KEY,
	MAGAZYN_CONTENT_CACHE_TAG,
} from "./metadata-keys";

export type RawStoreMetadataBlob = {
	siteSettings: unknown;
	pageSeo: unknown;
	pageContent: unknown;
	globalContent: unknown;
	themeTokens: unknown;
};

const REVALIDATE_SECONDS = 3600;
const FETCH_TIMEOUT_MS = 30_000;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 750;

let cachedServiceToken: { token: string; at: number } | null = null;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getServiceTokenForRead(): Promise<string | null> {
	const email = serverEnv.adminEmail;
	const password = serverEnv.adminPassword?.trim();
	if (!email || !password) return null;

	if (cachedServiceToken && Date.now() - cachedServiceToken.at < 60 * 60 * 1000) {
		return cachedServiceToken.token;
	}

	for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
		try {
			const token = await loginWithEmailPassword(email, password);
			cachedServiceToken = { token, at: Date.now() };
			return token;
		} catch {
			if (attempt < RETRY_ATTEMPTS - 1) {
				await sleep(RETRY_DELAY_MS * (attempt + 1));
			}
		}
	}

	return null;
}

async function fetchStoreMetadataWithRetry(
	token: string,
	freshRead: boolean,
): Promise<Response | null> {
	const url = `${serverEnv.medusaBackendUrl}/admin/stores?limit=1&fields=id,metadata`;

	for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
				...(freshRead || isLocalCmsDirectMediaEnabled()
					? { cache: "no-store" as const }
					: {
							next: {
								revalidate: REVALIDATE_SECONDS,
								tags: [MAGAZYN_CONTENT_CACHE_TAG, "site-settings"],
							},
						}),
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});

			if (res.ok) return res;

			if (res.status >= 500 && attempt < RETRY_ATTEMPTS - 1) {
				await sleep(RETRY_DELAY_MS * (attempt + 1));
				continue;
			}

			return res;
		} catch {
			if (attempt < RETRY_ATTEMPTS - 1) {
				await sleep(RETRY_DELAY_MS * (attempt + 1));
				continue;
			}
		}
	}

	return null;
}

/**
 * Jeden odczyt Store.metadata dla storefrontu.
 * Dedup w ramach renderu (`cache`) + ISR (60s) dla błyskawicznego response.
 * Przy niepowodzeniu (np. build gdy backend niedostępny) zwraca null — defaults mają lokalne hero.
 */
export const fetchStoreMetadataBlob = cache(async (): Promise<RawStoreMetadataBlob | null> => {
	const email = serverEnv.adminEmail;
	const password = serverEnv.adminPassword?.trim();
	if (!email || !password) {
		if (process.env.NODE_ENV === "development") {
			console.warn(
				"[CMS] Brak MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD — używam domyślnych treści (patrz apps/storefront/.env.local.example).",
			);
		}
		return null;
	}

	const token = await getServiceTokenForRead();
	if (!token) {
		console.warn(
			"[CMS] Logowanie do Medusa Admin nie powiodło się — sprawdź konto serwisowe i czy backend działa (localhost:9000 lub MEDUSA_BACKEND_URL).",
		);
		return null;
	}

	// Tryb „edycji na żywo" (draftMode, panel magazynu): zawsze świeży odczyt —
	// klient po zapisie widzi zmianę od razu, bez czekania na ISR/revalidate.
	let freshRead = false;
	try {
		freshRead = (await draftMode()).isEnabled;
	} catch {
		/* poza request scope (np. build) — normalna ścieżka z cache */
	}

	const res = await fetchStoreMetadataWithRetry(token, freshRead);
	if (!res?.ok) {
		console.error(`[CMS] Fetch Store.metadata failed: ${res?.status ?? "no response"}`);
		return null;
	}

	try {
		const data = (await res.json()) as {
			stores: Array<{ metadata?: Record<string, unknown> | null }>;
		};
		const metadata = data.stores[0]?.metadata ?? {};

		return {
			siteSettings: metadata[MAGAZYN_SITE_SETTINGS_KEY],
			pageSeo: metadata[MAGAZYN_PAGE_SEO_KEY],
			pageContent: metadata[MAGAZYN_PAGE_CONTENT_KEY],
			globalContent: metadata[MAGAZYN_GLOBAL_CONTENT_KEY],
			themeTokens: metadata[MAGAZYN_THEME_TOKENS_KEY],
		};
	} catch (e) {
		console.error("[CMS] Błąd parsowania Store.metadata:", e);
		return null;
	}
});
