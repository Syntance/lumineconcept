import type { RawHitsDailyPoint } from "./types";

export function toIsoDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export function formatDayLabel(iso: string): string {
	const date = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

export function calendarDaysInRange(fromIso: string, toIso: string): number {
	const from = new Date(`${fromIso}T12:00:00`);
	const to = new Date(`${toIso}T12:00:00`);
	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return 0;
	const ms = to.getTime() - from.getTime();
	return Math.floor(ms / 86_400_000) + 1;
}

export function fillDailyRange(
	fromIso: string,
	toIso: string,
	rows: Array<{ date: string; hits: number }>,
): RawHitsDailyPoint[] {
	const hitsByDay = new Map(rows.map((row) => [row.date, row.hits]));
	const points: RawHitsDailyPoint[] = [];
	const cursor = new Date(`${fromIso}T12:00:00`);
	const end = new Date(`${toIso}T12:00:00`);

	while (cursor <= end) {
		const iso = toIsoDate(cursor);
		points.push({
			date: iso,
			label: formatDayLabel(iso),
			hits: hitsByDay.get(iso) ?? 0,
		});
		cursor.setDate(cursor.getDate() + 1);
	}

	return points;
}

export function formatTrackingSince(iso: string): string {
	const date = new Date(`${iso}T12:00:00`);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}
