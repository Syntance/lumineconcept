import "server-only";

import { analyticsEnv } from "../env";

const FETCH_TIMEOUT_MS = 15_000;

type PosthogProject = {
	id: number | string;
	name?: string;
};

type PosthogProjectsResponse = {
	results?: PosthogProject[];
};

let cachedProjectId: string | null | undefined;

/** ID projektu z ENV lub auto-resolve przez PostHog API (cache procesu). */
export async function resolvePosthogProjectId(): Promise<string | undefined> {
	const fromEnv = analyticsEnv.posthogProjectId;
	if (fromEnv) return fromEnv;

	if (cachedProjectId !== undefined) {
		return cachedProjectId ?? undefined;
	}

	const apiKey = analyticsEnv.posthogApiKey;
	if (!apiKey) {
		cachedProjectId = null;
		return undefined;
	}

	try {
		const response = await fetch(`${analyticsEnv.posthogHost}/api/projects/`, {
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});

		if (!response.ok) {
			cachedProjectId = null;
			return undefined;
		}

		const payload = (await response.json()) as PosthogProjectsResponse;
		const first = payload.results?.[0];
		const id = first?.id;
		if (id === undefined || id === null) {
			cachedProjectId = null;
			return undefined;
		}

		cachedProjectId = String(id);
		return cachedProjectId;
	} catch {
		cachedProjectId = null;
		return undefined;
	}
}
