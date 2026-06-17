"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@magazyn/core/lib/cn";

export type PickerOption = {
	value: string;
	label: string;
};

type PickerSelectProps = {
	label: string;
	value: string;
	options: PickerOption[];
	onChange: (value: string) => void;
	className?: string;
	minWidthClass?: string;
};

export function PickerSelect({
	label,
	value,
	options,
	onChange,
	className,
	minWidthClass = "min-w-[9rem]",
}: PickerSelectProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const listId = useId();
	const selected = options.find((option) => option.value === value);

	useEffect(() => {
		if (!open) return;
		function onPointerDown(event: MouseEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	return (
		<div ref={rootRef} className={cn("inline-flex w-fit flex-col gap-1.5", className)}>
			<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</span>
			<div className="relative inline-block">
				<button
					type="button"
					aria-haspopup="listbox"
					aria-expanded={open}
					aria-controls={listId}
					onClick={() => {
						setOpen((current) => !current);
					}}
					className={cn(
						"flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
						minWidthClass,
					)}
				>
					<span className="truncate">{selected?.label ?? "—"}</span>
					<ChevronDown
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform",
							open && "rotate-180",
						)}
						aria-hidden
					/>
				</button>
				{open ? (
					<ul
						id={listId}
						role="listbox"
						aria-label={label}
						className="absolute top-[calc(100%+0.375rem)] left-0 z-30 max-h-56 min-w-full w-max overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg"
					>
					{options.map((option) => {
						const active = option.value === value;
						return (
							<li key={option.value} role="option" aria-selected={active}>
								<button
									type="button"
									onClick={() => {
										onChange(option.value);
										setOpen(false);
									}}
									className={cn(
										"w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
										active
											? "bg-primary/10 font-medium text-foreground"
											: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
									)}
								>
									{option.label}
								</button>
							</li>
						);
					})}
				</ul>
				) : null}
			</div>
		</div>
	);
}

export const periodFieldClass =
	"h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
