import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * POST /store/custom/track-hit — surowy licznik wejść na stronę, NIEZALEŻNY od
 * zgody na cookies (wywoływany z middleware storefrontu dla każdego GET na
 * realną stronę, zanim baner cookies w ogóle się pokaże).
 *
 * Celowo nie zapisujemy: adresu IP, user-agenta, żadnego identyfikatora
 * użytkownika ani distinct_id — wyłącznie licznik (dzień, ścieżka) => hits.
 * Jedna osoba odwiedzająca stronę kilka razy = kilka wpisów (brak deduplikacji
 * po osobie, to jest surowa liczba żądań, nie liczba unikalnych użytkowników).
 *
 * IP jest używane WYŁĄCZNIE w pamięci do sprawdzenia listy wykluczeń
 * (ANALYTICS_EXCLUDED_IPS) i natychmiast odrzucane — nigdy nie trafia do bazy
 * ani logów.
 */

const MAX_PATH_LENGTH = 200;

type KnexLike = {
	raw: (sql: string, bindings?: unknown[]) => Promise<unknown>;
};

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

function getClientIp(req: MedusaRequest): string | null {
	const forwarded = req.headers["x-forwarded-for"];
	const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
	const first = raw?.split(",")[0]?.trim();
	if (first) return first;
	return (req.socket as { remoteAddress?: string } | undefined)?.remoteAddress ?? null;
}

function isExcludedIp(ip: string | null): boolean {
	if (!ip) return false;
	const list = (process.env.ANALYTICS_EXCLUDED_IPS ?? "")
		.split(",")
		.map((v) => v.trim())
		.filter(Boolean);
	return list.includes(ip);
}

function normalizePath(raw: unknown): string | null {
	if (typeof raw !== "string" || !raw.startsWith("/")) return null;
	const withoutQuery = raw.split("?")[0]?.split("#")[0];
	if (!withoutQuery) return null;
	return withoutQuery.slice(0, MAX_PATH_LENGTH);
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
	const body = req.body as { path?: unknown } | undefined;
	const path = normalizePath(body?.path);

	if (!path) {
		res.status(204).end();
		return;
	}

	// Sprawdzenie wykluczenia — IP nigdy nie jest zapisywane, tylko porównywane w pamięci.
	if (isExcludedIp(getClientIp(req))) {
		res.status(204).end();
		return;
	}

	try {
		const knex = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as KnexLike;
		await ensureTable(knex);
		await knex.raw(
			`INSERT INTO raw_page_hit_daily (day, path, hits)
       VALUES (CURRENT_DATE, ?, 1)
       ON CONFLICT (day, path) DO UPDATE SET hits = raw_page_hit_daily.hits + 1`,
			[path],
		);
	} catch {
		// Best-effort — licznik nigdy nie może wywalić requestu strony.
	}

	res.status(204).end();
}
