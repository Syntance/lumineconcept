import "server-only";
import { cache } from "react";
import { serverEnv } from "@magazyn/core/env";
import { resolveMedusaAdminEmail } from "@magazyn/core/medusa/client";
import {
	MAGAZYN_GLOBAL_CONTENT_KEY,
	MAGAZYN_PAGE_CONTENT_KEY,
	MAGAZYN_PAGE_SEO_KEY,
	MAGAZYN_SITE_SETTINGS_KEY,
	MAGAZYN_CONTENT_CACHE_TAG,
} from "./metadata-keys";

export type RawStoreMetadataBlob = {
	siteSettings: unknown;
	pageSeo: unknown;
	pageContent: unknown;
	globalContent: unknown;
};

const REVALIDATE_SECONDS = 300;

let cachedServiceToken: { token: string; at: number } | null = null;

async function getServiceTokenForRead(): Promise<string | null> {
	const email = serverEnv.adminEmail ? resolveMedusaAdminEmail(serverEnv.adminEmail) : undefined;
	const password = serverEnv.adminPassword;
	if (!email || !password) return null;

	if (cachedServiceToken && Date.now() - cachedServiceToken.at < 60 * 60 * 1000) {
		return cachedServiceToken.token;
	}

	try {
		const res = await fetch(`${serverEnv.medusaBackendUrl}/auth/user/emailpass`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			signal: AbortSignal.timeout(10_000),
		});
		if (!res.ok) return null;
		const data = (await res.json()) as { token?: string };
		if (!data.token) return null;
		cachedServiceToken = { token: data.token, at: Date.now() };
		return data.token;
	} catch {
		return null;
	}
}

/**
 * Jeden cache'owany odczyt Store.metadata dla storefrontu.
 * Dedup w ramach renderu (`cache`) + ISR/tag dla webhooków.
 */
export const fetchStoreMetadataBlob = cache(async (): Promise<RawStoreMetadataBlob | null> => {
	const token = await getServiceTokenForRead();
	if (!token) return null;

	try {
		const res = await fetch(
			`${serverEnv.medusaBackendUrl}/admin/stores?limit=1&fields=id,metadata`,
			{
				headers: { Authorization: `Bearer ${token}` },
				next: {
					revalidate: REVALIDATE_SECONDS,
					tags: [MAGAZYN_CONTENT_CACHE_TAG, "site-settings"],
				},
			},
		);
		if (!res.ok) return null;
		const data = (await res.json()) as {
			stores: Array<{ metadata?: Record<string, unknown> | null }>;
		};
		const metadata = data.stores[0]?.metadata ?? {};
		return {
			siteSettings: metadata[MAGAZYN_SITE_SETTINGS_KEY],
			pageSeo: metadata[MAGAZYN_PAGE_SEO_KEY],
			pageContent: metadata[MAGAZYN_PAGE_CONTENT_KEY],
			globalContent: metadata[MAGAZYN_GLOBAL_CONTENT_KEY],
		};
	} catch {
		return null;
	}
});
