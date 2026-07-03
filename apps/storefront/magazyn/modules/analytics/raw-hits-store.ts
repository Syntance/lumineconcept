import "server-only";

import { adminFetch } from "@magazyn/core/medusa/client";
import type { RawHitsData } from "./types";

type RawHitsApiResponse = {
	totalHits: number;
	rangeDays: number;
	days: Array<{ date: string; hits: number }>;
	topPaths: Array<{ path: string; hits: number }>;
};

function formatDayLabel(iso: string): string {
	const date = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

/** Surowe, niezależne od cookies wejścia na stronę (patrz backend track-hit). */
export async function fetchRawHits(rangeDays: number): Promise<RawHitsData> {
	try {
		const data = await adminFetch<RawHitsApiResponse>(
			`/admin/custom/raw-hits?days=${rangeDays}`,
			{ fresh: true },
		);

		return {
			status: "connected",
			fetchedAt: new Date().toISOString(),
			rangeDays: data.rangeDays,
			totalHits: data.totalHits,
			daily: data.days.map((point) => ({
				date: point.date,
				label: formatDayLabel(point.date),
				hits: point.hits,
			})),
			topPaths: data.topPaths,
		};
	} catch (error) {
		return {
			status: "error",
			reason: error instanceof Error ? error.message : "Nie udało się pobrać surowych wejść.",
		};
	}
}
