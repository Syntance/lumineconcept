import "server-only";

import { adminFetch } from "@magazyn/core/medusa/client";
import { fillDailyRange, toIsoDate } from "./raw-hits-utils";
import type { SalesPeriod } from "./sales-period";
import type { RawHitsData } from "./types";

type RawHitsApiResponse = {
	totalHits: number;
	rangeFrom: string;
	rangeTo: string;
	trackingSince: string | null;
	days: Array<{ date: string; hits: number }>;
	topPaths: Array<{ path: string; hits: number }>;
};

/** Surowe, niezależne od cookies wejścia na stronę (patrz backend track-hit). */
export async function fetchRawHits(period: SalesPeriod): Promise<RawHitsData> {
	const from = toIsoDate(period.rangeStart);
	const to = toIsoDate(period.rangeEnd);

	try {
		const data = await adminFetch<RawHitsApiResponse>(
			`/admin/custom/raw-hits?from=${from}&to=${to}`,
			{ fresh: true },
		);

		return {
			status: "connected",
			fetchedAt: new Date().toISOString(),
			rangeFrom: data.rangeFrom,
			rangeTo: data.rangeTo,
			trackingSince: data.trackingSince,
			totalHits: data.totalHits,
			daily: fillDailyRange(data.rangeFrom, data.rangeTo, data.days),
			topPaths: data.topPaths,
		};
	} catch (error) {
		return {
			status: "error",
			reason: error instanceof Error ? error.message : "Nie udało się pobrać surowych wejść.",
		};
	}
}
