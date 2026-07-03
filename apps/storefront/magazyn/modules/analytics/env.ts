import "server-only";

import { z } from "zod";

const optionalTrimmed = z
	.string()
	.optional()
	.transform((value) => sanitizeEnvScalar(value));

function sanitizeEnvScalar(value: string | undefined): string | undefined {
	if (!value) return undefined;
	let trimmed = value.trim().replace(/\r?\n/g, "");
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		trimmed = trimmed.slice(1, -1).trim();
	}
	return trimmed || undefined;
}

function normalizeGa4PropertyId(value: string | undefined): string | undefined {
	const cleaned = sanitizeEnvScalar(value);
	if (!cleaned) return undefined;
	const digitsOnly = cleaned.replace(/\D/g, "");
	return digitsOnly || undefined;
}

function parseServiceAccountJson(raw: string | undefined): Record<string, unknown> | null {
	const cleaned = sanitizeEnvScalar(raw);
	if (!cleaned) return null;
	try {
		let parsed: unknown = JSON.parse(cleaned);
		if (typeof parsed === "string") {
			parsed = JSON.parse(parsed);
		}
		if (typeof parsed !== "object" || parsed === null) return null;
		return parsed as Record<string, unknown>;
	} catch {
		return null;
	}
}

const analyticsEnvSchema = z.object({
	FEATURE_ANALYTICS_PANEL: optionalTrimmed,
	GA4_PROPERTY_ID: optionalTrimmed,
	GA4_SERVICE_ACCOUNT_JSON: optionalTrimmed,
	GOOGLE_APPLICATION_CREDENTIALS_JSON: optionalTrimmed,
	POSTHOG_PERSONAL_API_KEY: optionalTrimmed,
	POSTHOG_API_KEY: optionalTrimmed,
	NEXT_PUBLIC_POSTHOG_KEY: optionalTrimmed,
	POSTHOG_PROJECT_ID: optionalTrimmed,
	POSTHOG_HOST: optionalTrimmed,
	NEXT_PUBLIC_POSTHOG_HOST: optionalTrimmed,
	NEXT_PUBLIC_GA4_ID: optionalTrimmed,
});

type ParsedAnalyticsEnv = z.infer<typeof analyticsEnvSchema>;

let cached: ParsedAnalyticsEnv | null = null;

function getParsed(): ParsedAnalyticsEnv {
	if (!cached) {
		const result = analyticsEnvSchema.safeParse(process.env);
		if (!result.success) {
			throw new Error(`Nieprawidłowa konfiguracja analityki: ${result.error.message}`);
		}
		cached = result.data;
	}
	return cached;
}

/** Ingest host (eu.i.posthog.com) → panel API (eu.posthog.com). */
export function normalizePosthogAppHost(raw: string | undefined): string {
	if (!raw) return "https://eu.posthog.com";
	const trimmed = raw.trim().replace(/\/$/, "");
	try {
		const url = new URL(trimmed);
		if (url.hostname.endsWith(".i.posthog.com")) {
			url.hostname = url.hostname.replace(".i.posthog.com", ".posthog.com");
		}
		return url.origin;
	} catch {
		return "https://eu.posthog.com";
	}
}

function firstDefined(...values: Array<string | undefined>): string | undefined {
	for (const value of values) {
		if (value) return value;
	}
	return undefined;
}

export const analyticsEnv = {
	get panelEnabled(): boolean {
		const flag = getParsed().FEATURE_ANALYTICS_PANEL;
		if (flag === "0" || flag === "false") return false;
		return true;
	},
	get ga4MeasurementId(): string | undefined {
		return getParsed().NEXT_PUBLIC_GA4_ID;
	},
	get ga4PropertyId(): string | undefined {
		return normalizeGa4PropertyId(getParsed().GA4_PROPERTY_ID);
	},
	get ga4Credentials(): Record<string, unknown> | null {
		const raw = firstDefined(
			getParsed().GA4_SERVICE_ACCOUNT_JSON,
			getParsed().GOOGLE_APPLICATION_CREDENTIALS_JSON,
		);
		return parseServiceAccountJson(raw);
	},
	get ga4Configured(): boolean {
		return Boolean(analyticsEnv.ga4PropertyId && analyticsEnv.ga4Credentials);
	},
	/** Klucz Query API: dedykowany personal → backend → publiczny project key. */
	get posthogApiKey(): string | undefined {
		return firstDefined(
			getParsed().POSTHOG_PERSONAL_API_KEY,
			getParsed().POSTHOG_API_KEY,
			getParsed().NEXT_PUBLIC_POSTHOG_KEY,
		);
	},
	get posthogProjectId(): string | undefined {
		return getParsed().POSTHOG_PROJECT_ID;
	},
	get posthogHost(): string {
		const host = firstDefined(getParsed().POSTHOG_HOST, getParsed().NEXT_PUBLIC_POSTHOG_HOST);
		return normalizePosthogAppHost(host);
	},
	get posthogConfigured(): boolean {
		return Boolean(analyticsEnv.posthogApiKey);
	},
};
