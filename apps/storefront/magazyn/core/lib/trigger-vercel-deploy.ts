import "server-only";

/**
 * Uruchamia produkcyjny deploy na Vercel (Deploy Hook).
 * Po deployu `prebuild` ściąga CMS → static files → instant load.
 */
export async function triggerVercelDeploy(reason?: string): Promise<void> {
	const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
	if (!hookUrl) {
		console.warn(
			"[Deploy] VERCEL_DEPLOY_HOOK_URL nie ustawiony — pomijam auto-deploy.",
			reason ? `(${reason})` : "",
		);
		return;
	}

	try {
		const res = await fetch(hookUrl, {
			method: "POST",
			signal: AbortSignal.timeout(30_000),
		});

		if (!res.ok) {
			console.error(`[Deploy] Hook failed: ${res.status} ${res.statusText}`);
			return;
		}

		console.log("[Deploy] Vercel deploy triggered", reason ? `(${reason})` : "");
	} catch (error) {
		console.error("[Deploy] Hook error:", error);
	}
}
