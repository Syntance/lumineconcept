import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/custom/raw-hits?days=30 — surowe, niezależne od cookies wejścia
 * na stronę (patrz store/custom/track-hit). Chronione domyślnym auth Medusy
 * dla /admin/* (sesja panelu Magazyn).
 */

type KnexLike = {
	raw: (sql: string, bindings?: unknown[]) => Promise<{ rows: unknown[] }>;
};

const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

let tableEnsured = false;

async function ensureTable(knex: KnexLike): Promise<void> {
	if (tableEnsured) return;
	await knex.raw(`
    CREATE TABLE IF NOT EXISTS raw_page_hit_daily (
      day date NOT NULL,
      path text NOT NULL,
      hits integer NOT NULL DEFAULT 0,
      PRIMARY KEY (day, path)
    )
  `);
	tableEnsured = true;
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
	const rawDays = Number((req.query as Record<string, string>).days ?? DEFAULT_DAYS);
	const days = Number.isFinite(rawDays)
		? Math.min(Math.max(Math.trunc(rawDays), 1), MAX_DAYS)
		: DEFAULT_DAYS;

	try {
		const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as KnexLike;
		await ensureTable(knex);

		const dailyResult = await knex.raw(
			`SELECT day, SUM(hits)::int AS hits
       FROM raw_page_hit_daily
       WHERE day >= CURRENT_DATE - (?::int - 1)
       GROUP BY day
       ORDER BY day`,
			[days],
		);

		const topPathsResult = await knex.raw(
			`SELECT path, SUM(hits)::int AS hits
       FROM raw_page_hit_daily
       WHERE day >= CURRENT_DATE - (?::int - 1)
       GROUP BY path
       ORDER BY hits DESC
       LIMIT 15`,
			[days],
		);

		const dailyRows = (dailyResult.rows ?? []) as Array<{ day: string | Date; hits: number }>;
		const topPathRows = (topPathsResult.rows ?? []) as Array<{ path: string; hits: number }>;

		const totalHits = dailyRows.reduce((sum, row) => sum + Number(row.hits), 0);

		res.json({
			totalHits,
			rangeDays: days,
			days: dailyRows.map((row) => ({
				date: new Date(row.day).toISOString().slice(0, 10),
				hits: Number(row.hits),
			})),
			topPaths: topPathRows.map((row) => ({ path: row.path, hits: Number(row.hits) })),
		});
	} catch (error) {
		res.status(500).json({
			message: error instanceof Error ? error.message : "Błąd odczytu raw-hits.",
		});
	}
}
