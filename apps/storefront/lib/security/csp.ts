/**
 * CSP z nonce + strict-dynamic (middleware generuje nonce per request).
 * `style-src 'unsafe-inline'` wymagane przez Framer Motion / inline style (patrz 55-security).
 */

function collectMediaCdnOrigins(): string[] {
	const origins = new Set<string>();
	for (const raw of [process.env.S3_FILE_URL, process.env.NEXT_PUBLIC_S3_FILE_URL]) {
		if (!raw?.trim()) continue;
		try {
			origins.add(new URL(raw.trim()).origin);
		} catch {
			/* skip invalid */
		}
	}
	return [...origins];
}

const MEDUSA_BACKEND_URL =
	process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const MEILISEARCH_HOST =
	process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700";
const SENTRY_CSP_HOSTS = process.env.NEXT_PUBLIC_SENTRY_DSN
	? " https://*.ingest.sentry.io https://*.sentry.io"
	: "";

const mediaCdnOrigins = collectMediaCdnOrigins();
const r2CspOrigin = mediaCdnOrigins.length > 0 ? ` ${mediaCdnOrigins.join(" ")}` : "";

export function buildContentSecurityPolicy(nonce: string): string {
	const isDev = process.env.NODE_ENV === "development";
	const scriptSrc = [
		"'self'",
		`'nonce-${nonce}'`,
		"'strict-dynamic'",
		// Fallback dla starszych UA (Lighthouse): ignorowane gdy nonce + strict-dynamic działają.
		"'unsafe-inline'",
		isDev ? "'unsafe-eval'" : null,
	]
		.filter(Boolean)
		.join(" ");

	return [
		"default-src 'self'",
		`script-src ${scriptSrc}`,
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		`img-src 'self' data: blob: https://res.cloudinary.com https://cdn.sanity.io https://www.facebook.com https://www.google-analytics.com https://images.unsplash.com https://*.r2.dev ${MEDUSA_BACKEND_URL}${r2CspOrigin}`,
		"font-src 'self' https://fonts.gstatic.com",
		`connect-src 'self' https://eu.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://connect.facebook.net https://www.facebook.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://api.mailerlite.com https://challenges.cloudflare.com https://*.r2.dev ${MEDUSA_BACKEND_URL} ${MEILISEARCH_HOST}${SENTRY_CSP_HOSTS}`,
		"frame-src 'self' https://www.facebook.com https://challenges.cloudflare.com",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join("; ");
}
