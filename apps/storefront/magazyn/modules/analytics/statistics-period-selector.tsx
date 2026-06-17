"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@magazyn/core/lib/cn";
import { magazynConfig } from "@magazyn/magazyn.config";
import { PickerSelect, periodFieldClass } from "./picker-select";
import {
	buildMonthPickerOptions,
	buildYearPickerOptions,
	parseSalesPeriod,
	toPeriodSearchParams,
	type SalesPeriodPreset,
} from "./sales-period";

const PRESETS: Array<{ id: SalesPeriodPreset; label: string }> = [
	{ id: "miesiac", label: "Bieżący miesiąc" },
	{ id: "rok", label: "Rok" },
	{ id: "wszystko", label: "Od początku" },
	{ id: "miesiac-wybor", label: "Wybierz miesiąc" },
	{ id: "zakres", label: "Zakres dat" },
];

function todayIso(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function monthStartIso(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function StatisticsPeriodSelector() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const current = useMemo(
		() =>
			parseSalesPeriod({
				okres: searchParams.get("okres") ?? undefined,
				rok: searchParams.get("rok") ?? undefined,
				miesiac: searchParams.get("miesiac") ?? undefined,
				od: searchParams.get("od") ?? undefined,
				do: searchParams.get("do") ?? undefined,
			}),
		[searchParams],
	);

	const [customFrom, setCustomFrom] = useState(searchParams.get("od") ?? monthStartIso());
	const [customTo, setCustomTo] = useState(searchParams.get("do") ?? todayIso());
	const [pickedYear, setPickedYear] = useState(
		searchParams.get("rok") ?? String(new Date().getFullYear()),
	);
	const [pickedMonth, setPickedMonth] = useState(
		searchParams.get("miesiac") ??
			`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
	);

	const monthOptions = useMemo(() => buildMonthPickerOptions(), []);
	const yearOptions = useMemo(() => buildYearPickerOptions(), []);

	function navigate(period: {
		preset: SalesPeriodPreset;
		year?: number;
		monthKey?: string;
		from?: string;
		to?: string;
	}) {
		const params = toPeriodSearchParams(period);
		const base = `${magazynConfig.basePath}/panel/statystyki`;
		router.push(params.size > 0 ? `${base}?${params.toString()}` : base);
	}

	return (
		<section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Okres statystyk
					</p>
					<p className="mt-0.5 font-serif text-lg text-foreground">{current.rangeLabel}</p>
				</div>
			</div>

			<div
				className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
				role="group"
				aria-label="Preset okresu"
			>
				{PRESETS.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						onClick={() => {
							if (id === "rok") {
								navigate({ preset: id, year: Number(pickedYear) });
								return;
							}
							if (id === "miesiac-wybor") {
								navigate({ preset: id, monthKey: pickedMonth });
								return;
							}
							if (id === "zakres") {
								navigate({ preset: id, from: customFrom, to: customTo });
								return;
							}
							navigate({ preset: id });
						}}
						className={cn(
							"rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							current.preset === id
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{label}
					</button>
				))}
			</div>

			{current.preset === "rok" ? (
				<PickerSelect
					label="Rok"
					value={String(current.year ?? pickedYear)}
					options={yearOptions}
					minWidthClass="min-w-[7.5rem]"
					onChange={(value) => {
						setPickedYear(value);
						navigate({ preset: "rok", year: Number(value) });
					}}
				/>
			) : null}

			{current.preset === "miesiac-wybor" ? (
				<PickerSelect
					label="Miesiąc"
					value={pickedMonth}
					options={monthOptions}
					minWidthClass="min-w-[14rem]"
					onChange={(value) => {
						setPickedMonth(value);
						navigate({ preset: "miesiac-wybor", monthKey: value });
					}}
				/>
			) : null}

			{current.preset === "zakres" ? (
				<form
					className="flex flex-wrap items-end gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						navigate({ preset: "zakres", from: customFrom, to: customTo });
					}}
				>
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Od
						</span>
						<input
							type="date"
							value={customFrom}
							max={customTo}
							onChange={(event) => {
								setCustomFrom(event.target.value);
							}}
							className={periodFieldClass}
						/>
					</label>
					<label className="flex flex-col gap-1.5 text-sm">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Do
						</span>
						<input
							type="date"
							value={customTo}
							min={customFrom}
							max={todayIso()}
							onChange={(event) => {
								setCustomTo(event.target.value);
							}}
							className={periodFieldClass}
						/>
					</label>
					<button
						type="submit"
						className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					>
						Zastosuj
					</button>
				</form>
			) : null}
		</section>
	);
}
