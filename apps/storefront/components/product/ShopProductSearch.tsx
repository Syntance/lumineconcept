"use client";

import { Search, X } from "lucide-react";

type ShopProductSearchProps = {
	value: string;
	onChange: (value: string) => void;
	/** Gdy true — krótszy placeholder na mobile w sticky pasku. */
	compact?: boolean;
};

export function ShopProductSearch({ value, onChange, compact }: ShopProductSearchProps) {
	return (
		<div className="relative w-full">
			<Search
				className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400"
				aria-hidden
			/>
			<input
				type="text"
				role="searchbox"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={
					compact ? "Szukaj…" : "Szukaj produktów po nazwie, opisie…"
				}
				className="h-10 w-full rounded-md border border-brand-200 bg-white py-2 pl-10 pr-10 text-sm text-brand-800 outline-none placeholder:text-brand-400 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-200"
				aria-label="Szukaj produktów"
				autoComplete="off"
				enterKeyHint="search"
			/>
			{value.length > 0 ? (
				<button
					type="button"
					onClick={() => onChange("")}
					className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-brand-400 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					aria-label="Wyczyść wyszukiwanie"
				>
					<X className="h-4 w-4" />
				</button>
			) : null}
		</div>
	);
}
