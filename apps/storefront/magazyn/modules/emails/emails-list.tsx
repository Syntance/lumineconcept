"use client";

import Link from "next/link";
import { Edit3, Eye, Mail } from "lucide-react";
import { Button } from "@magazyn/core/ui/button";
import { cn } from "@magazyn/core/lib/cn";
import type { EmailTemplate } from "./template-types";
import { EMAIL_TEMPLATE_TYPES, isEmailTemplateEnabled } from "./template-types";

type Props = {
	templates: EmailTemplate[];
	basePath: string;
};

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
	return (
		<div className="rounded-xl border border-border bg-card p-5">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className="mt-1 font-serif text-2xl tabular-nums text-foreground">{value}</p>
			{sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
		</div>
	);
}

function StatusBadge({ enabled }: { enabled: boolean }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
				enabled
					? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
					: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
			)}
		>
			{enabled ? "Aktywny" : "Wyłączony"}
		</span>
	);
}

export function EmailsList({ templates, basePath }: Props) {
	const byType = new Map(templates.map((t) => [t.type, t]));
	const enabledCount = templates.filter((t) => isEmailTemplateEnabled(t)).length;
	const disabledCount = templates.length - enabledCount;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-serif text-2xl text-foreground">E-maile</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Szablony wiadomości transakcyjnych wysyłanych do klientów.
					</p>
				</div>
				<Button type="button" disabled title="Wkrótce — nowe typy szablonów dodajemy w kodzie.">
					<Mail className="size-4" aria-hidden />
					Nowy szablon
				</Button>
			</header>

			<div className="grid gap-4 sm:grid-cols-3">
				<StatTile label="Aktywne szablony" value={enabledCount} sub="Automatyczna wysyłka włączona" />
				<StatTile label="Łącznie" value={EMAIL_TEMPLATE_TYPES.length} sub="Zamówienie · Formularze" />
				<StatTile
					label="Wyłączone"
					value={disabledCount}
					sub={disabledCount > 0 ? "Wysyłka zatrzymana" : "Wszystkie aktywne"}
				/>
			</div>

			<ul className="flex flex-col gap-3">
				{EMAIL_TEMPLATE_TYPES.map(({ type, label, description }) => {
					const template = byType.get(type);
					const enabled = isEmailTemplateEnabled(template);

					return (
						<li key={type}>
							<article className="rounded-xl border border-border bg-card p-5">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
									<div className="flex flex-1 items-center gap-4">
										<div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
											<Mail className="size-4" aria-hidden />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<p className="text-sm font-semibold text-foreground">{label}</p>
												<StatusBadge enabled={enabled} />
											</div>
											<p className="mt-0.5 font-mono text-xs text-muted-foreground">{type}</p>
											<p className="mt-1 text-xs text-muted-foreground">{description}</p>
										</div>
									</div>

									<div className="flex gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled
											title="Podgląd dostępny w edytorze szablonu."
										>
											<Eye className="size-3.5" aria-hidden />
											Podgląd
										</Button>
										<Link
											href={`${basePath}/panel/maile/${type}`}
											className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
										>
											<Edit3 className="size-3.5" aria-hidden />
											Edytuj
										</Link>
									</div>
								</div>
							</article>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
