import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * GET /admin/custom/raw-hits?from=YYYY-MM-DD&to=YYYY-MM-DD — surowe wejścia
 * w wybranym okresie kalendarzowym (zgodnym z filtrem Statystyk). Fallback:
 * ?days=30 (okno wstecz od dziś). Patrz store/custom/track-hit.
 */

type KnexLike = {
	raw: (sql: string, bindings?: unknown[]) => Promise<{ rows: unknown[] }>;
};

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

let tableEnsured = false;

function parseIsoDate(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const match = ISO_DATE.exec(value.trim());
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const probe = new Date(year, month - 1, day);
	if (
		probe.getFullYear() !== year ||
		probe.getMonth() !== month - 1 ||
		probe.getDate() !== day
	) {
		return null;
	}
	return `${match[1]}-${match[2]}-${match[3]}`;
}

function rollingRange(days: number): { from: string; to: string } {
	const to = new Date();
	const from = new Date(to);
	from.setDate(from.getDate() - (days - 1));
	return {
		from: from.toISOString().slice(0, 10),
		to: to.toISOString().slice(0, 10),
	};
}

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
	const query = req.query as Record<string, string>;
	const fromParam = parseIsoDate(query.from);
	const toParam = parseIsoDate(query.to);

	let fromDate: string;
	let toDate: string;

	if (fromParam && toParam && fromParam <= toParam) {
		fromDate = fromParam;
		toDate = toParam;
	} else {
		const rawDays = Number(query.days ?? DEFAULT_DAYS);
		const days = Number.isFinite(rawDays)
			? Math.min(Math.max(Math.trunc(rawDays), 1), MAX_DAYS)
			: DEFAULT_DAYS;
		({ from: fromDate, to: toDate } = rollingRange(days));
	}

	try {
		const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as KnexLike;
		await ensureTable(knex);

		const dailyResult = await knex.raw(
			`SELECT day, SUM(hits)::int AS hits
       FROM raw_page_hit_daily
       WHERE day >= ?::date AND day <= ?::date
       GROUP BY day
       ORDER BY day`,
			[fromDate, toDate],
		);

		const topPathsResult = await knex.raw(
			`SELECT path, SUM(hits)::int AS hits
       FROM raw_page_hit_daily
       WHERE day >= ?::date AND day <= ?::date
       GROUP BY path
       ORDER BY hits DESC
       LIMIT 15`,
			[fromDate, toDate],
		);

		const sinceResult = await knex.raw(
			`SELECT MIN(day)::text AS since FROM raw_page_hit_daily`,
		);

		const dailyRows = (dailyResult.rows ?? []) as Array<{ day: string | Date; hits: number }>;
		const topPathRows = (topPathsResult.rows ?? []) as Array<{ path: string; hits: number }>;
		const sinceRow = (sinceResult.rows?.[0] ?? {}) as { since?: string | null };

		const totalHits = dailyRows.reduce((sum, row) => sum + Number(row.hits), 0);

		res.json({
			totalHits,
			rangeFrom: fromDate,
			rangeTo: toDate,
			trackingSince: sinceRow.since ?? null,
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
