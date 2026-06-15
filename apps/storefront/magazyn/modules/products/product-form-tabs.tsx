"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@moduly/ui";

type TabId = "colors" | "stand" | "fields" | "seo";

type TabDef = { id: TabId; label: string };

const COLORS_TAB: TabDef = { id: "colors", label: "Edycja kolorów" };
const STAND_TAB: TabDef = { id: "stand", label: "Podstawka" };
const FIELDS_TAB: TabDef = { id: "fields", label: "Pola" };
const SEO_TAB: TabDef = { id: "seo", label: "SEO i treści" };

type Props = {
	colorsPanel: ReactNode;
	standPanel?: ReactNode;
	fieldsPanel: ReactNode;
	seoPanel: ReactNode;
	fieldsCount?: number;
	showStandTab?: boolean;
};

export function ProductFormTabs({
	colorsPanel,
	standPanel,
	fieldsPanel,
	seoPanel,
	fieldsCount = 0,
	showStandTab = false,
}: Props) {
	const baseId = useId();
	const tabs: TabDef[] = showStandTab
		? [COLORS_TAB, STAND_TAB, FIELDS_TAB, SEO_TAB]
		: [COLORS_TAB, FIELDS_TAB, SEO_TAB];
	const [activeTab, setActiveTab] = useState<TabId>("colors");

	function panelForTab(id: TabId): ReactNode {
		switch (id) {
			case "colors":
				return colorsPanel;
			case "stand":
				return standPanel;
			case "fields":
				return fieldsPanel;
			case "seo":
				return seoPanel;
		}
	}

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<div
				role="tablist"
				aria-label="Konfiguracja produktu"
				className="flex border-b border-border bg-muted/20"
			>
				{tabs.map((tab) => {
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

			{tabs.map((tab) => {
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
						{panelForTab(tab.id)}
					</div>
				);
			})}
		</div>
	);
}
