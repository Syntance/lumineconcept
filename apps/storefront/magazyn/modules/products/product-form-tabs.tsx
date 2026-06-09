"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@magazyn/core/lib/cn";

type TabId = "colors" | "fields";

const TABS: ReadonlyArray<{ id: TabId; label: string }> = [
	{ id: "colors", label: "Edycja kolorów" },
	{ id: "fields", label: "Pola" },
];

type Props = {
	colorsPanel: ReactNode;
	fieldsPanel: ReactNode;
	fieldsCount?: number;
};

export function ProductFormTabs({ colorsPanel, fieldsPanel, fieldsCount = 0 }: Props) {
	const baseId = useId();
	const [activeTab, setActiveTab] = useState<TabId>("colors");

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<div
				role="tablist"
				aria-label="Konfiguracja produktu"
				className="flex border-b border-border bg-muted/20"
			>
				{TABS.map((tab) => {
					const selected = activeTab === tab.id;
					const tabId = `${baseId}-${tab.id}`;
					const panelId = `${baseId}-${tab.id}-panel`;

					return (
						<button
							key={tab.id}
							type="button"
							id={tabId}
							role="tab"
							aria-selected={selected}
							aria-controls={panelId}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"relative flex min-h-11 flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors outline-none",
								"focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
								selected
									? "bg-card text-foreground"
									: "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
							)}
						>
							{tab.label}
							{tab.id === "fields" && fieldsCount > 0 ? (
								<span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-primary">
									{fieldsCount}
								</span>
							) : null}
							{selected ? (
								<span
									aria-hidden
									className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
								/>
							) : null}
						</button>
					);
				})}
			</div>

			{TABS.map((tab) => {
				const selected = activeTab === tab.id;
				const tabId = `${baseId}-${tab.id}`;
				const panelId = `${baseId}-${tab.id}-panel`;

				return (
					<div
						key={tab.id}
						id={panelId}
						role="tabpanel"
						aria-labelledby={tabId}
						hidden={!selected}
						className="p-5"
					>
						{tab.id === "colors" ? colorsPanel : fieldsPanel}
					</div>
				);
			})}
		</div>
	);
}
