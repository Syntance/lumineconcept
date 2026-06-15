"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@moduly/ui";
import { selectPanelThemePresetAction } from "./actions";
import { panelThemeToStyle } from "./panel-theme-vars";
import {
	PANEL_THEME_PRESETS,
	type PanelThemePreset,
	type PanelThemePresetId,
} from "./panel-theme-types";

type Props = {
	activePresetId: PanelThemePresetId;
};

function PresetPreview({ preset }: { preset: PanelThemePreset }) {
	return (
		<div
			className="rounded-lg border border-border bg-background p-3 text-foreground shadow-sm"
			style={panelThemeToStyle(preset.theme)}
		>
			<div className="flex gap-2 overflow-hidden rounded-md border border-border">
				<div className="w-[38%] space-y-1.5 bg-muted p-2">
					<div className="h-1.5 w-3/4 rounded-sm bg-foreground/15" />
					<div className="h-1.5 w-full rounded-sm bg-primary" />
					<div className="h-1.5 w-2/3 rounded-sm bg-foreground/10" />
					<div className="h-1.5 w-4/5 rounded-sm bg-foreground/10" />
				</div>
				<div className="flex flex-1 flex-col gap-1.5 bg-card p-2">
					<div className="h-2 w-2/3 rounded-sm bg-foreground/20" />
					<div className="h-1.5 w-full rounded-sm bg-muted-foreground/25" />
					<div className="mt-auto h-5 w-14 rounded-md bg-primary" />
				</div>
			</div>
		</div>
	);
}

export function PanelThemePicker({ activePresetId }: Props) {
	const router = useRouter();
	const [selectedId, setSelectedId] = useState(activePresetId);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const onSelect = (presetId: PanelThemePresetId) => {
		if (pending || presetId === selectedId) return;

		setError(null);
		setSelectedId(presetId);

		startTransition(async () => {
			const result = await selectPanelThemePresetAction(presetId);
			if (!result.ok) {
				setSelectedId(activePresetId);
				setError(result.error);
				return;
			}
			router.refresh();
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{PANEL_THEME_PRESETS.map((preset) => {
					const active = selectedId === preset.id;
					const busy = pending && active;

					return (
						<button
							key={preset.id}
							type="button"
							onClick={() => onSelect(preset.id)}
							disabled={pending}
							aria-pressed={active}
							className={cn(
								"group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors",
								"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
								active
									? "border-primary/40 ring-2 ring-primary/15"
									: "border-border hover:border-primary/25",
							)}
						>
							<div className="p-4">
								<PresetPreview preset={preset} />
							</div>

							<div className="border-t border-border px-4 py-3">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<p className="text-sm font-medium text-foreground">{preset.label}</p>
										<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
											{preset.description}
										</p>
									</div>
									{active ? (
										<span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
											{busy ? (
												<Loader2 className="size-3 animate-spin" aria-hidden />
											) : (
												<Check className="size-3" aria-hidden />
											)}
											Aktywny
										</span>
									) : null}
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{error ? (
				<p role="alert" className="text-sm text-destructive">
					{error}
				</p>
			) : null}

			<p className="text-xs leading-relaxed text-muted-foreground">
				Wybierz gotowy motyw — zmiana zapisuje się od razu i obowiązuje w całym panelu po odświeżeniu
				widoku.
			</p>
		</div>
	);
}
