"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { usePreventWindowFileDrop } from "@magazyn/core/hooks/use-prevent-window-file-drop";
import { cn } from "@magazyn/core/lib/cn";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { magazynConfig } from "@magazyn/magazyn.config";
import { PopupBannerTabIcon } from "@/components/layout/PopupBannerTabIcon";
import type { GlobalContent, PopupBanner, PopupBannerTabIcon as TabIcon, PopupBannerTarget, PopupBannersConfig } from "@/lib/content/types";
import { DEFAULT_POPUP_BANNERS } from "@/lib/content/defaults";
import {
	DEFAULT_POPUP_TAB_ICON,
	DEFAULT_POPUP_TAB_LABEL,
	POPUP_BANNER_TAB_ICON_OPTIONS,
	resolvePopupTabIcon,
	resolvePopupTabLabel,
} from "@/lib/content/popup-banner-tab-icons";
import { saveGlobalContentAction } from "./content-actions";
import { cmsSaveSuccessMessage } from "./cms-save-feedback";
import { cmsRevalidatePaths } from "./cms-nav";
import { newCmsId } from "./cms-id";
import { OgImageField } from "./seo/og-image-field";

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const PAGE_OPTIONS: { id: PopupBannerTarget; label: string }[] = [
	{ id: "all", label: "Cała witryna" },
	...magazynConfig.content.pages.map((page) => ({
		id: page.id as PopupBannerTarget,
		label: page.label,
	})),
];

type Props = {
	globalContent: GlobalContent;
};

function emptyConfig(): PopupBannersConfig {
	return { ...DEFAULT_POPUP_BANNERS, items: [] };
}

export function PopupBannersEditor({ globalContent: initialGlobal }: Props) {
	const [global, setGlobal] = useState(initialGlobal);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	usePreventWindowFileDrop();

	const config = global.popupBanners ?? emptyConfig();
	const items = config.items ?? [];

	function updateConfig(patch: Partial<PopupBannersConfig>) {
		setGlobal((prev) => ({
			...prev,
			popupBanners: { ...config, ...patch },
		}));
	}

	function updateBanner(index: number, patch: Partial<PopupBanner>) {
		updateConfig({
			items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
		});
	}

	function addBanner() {
		const banner: PopupBanner = {
			id: newCmsId("popup"),
			enabled: true,
			pageIds: ["all"],
			title: "",
			body: "",
			blurBackground: true,
			tabLabel: DEFAULT_POPUP_TAB_LABEL,
			tabIcon: DEFAULT_POPUP_TAB_ICON,
			order: items.length,
		};
		updateConfig({ items: [...items, banner] });
	}

	function removeBanner(index: number) {
		updateConfig({ items: items.filter((_, i) => i !== index) });
	}

	function togglePage(index: number, target: PopupBannerTarget, checked: boolean) {
		const banner = items[index];
		if (!banner) return;

		if (target === "all") {
			updateBanner(index, { pageIds: checked ? ["all"] : [] });
			return;
		}

		const withoutAll = banner.pageIds.filter((id) => id !== "all");
		const next = checked
			? [...withoutAll, target]
			: withoutAll.filter((id) => id !== target);
		updateBanner(index, { pageIds: next });
	}

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);

		startTransition(async () => {
			const result = await saveGlobalContentAction(global, cmsRevalidatePaths());
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setSuccessMessage(cmsSaveSuccessMessage());
		});
	}

	return (
		<form onSubmit={onSubmit} className="flex max-w-3xl flex-col gap-6">
			<fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
				<legend className="px-1 text-sm font-medium">Banery popup</legend>
				<p className="text-xs text-muted-foreground">
					Callout na środku ekranu (~40% szerokości), dopasowany do treści. Po zamknięciu —
					wąski pasek ze skrzynką z lewej. Tekst live po zapisie; zdjęcia — po Redeploy u góry.
				</p>
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={config.enabled}
						onChange={(e) => updateConfig({ enabled: e.target.checked })}
						className="size-4"
					/>
					Włączone (cała funkcja popupów)
				</label>
			</fieldset>

			{items.map((banner, index) => (
				<fieldset
					key={banner.id}
					className="flex flex-col gap-3 rounded-xl border border-border p-4"
				>
					<legend className="flex w-full items-center justify-between gap-2 px-1 text-sm font-medium">
						<span>Baner {index + 1}</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => removeBanner(index)}
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="size-4" aria-hidden />
							Usuń
						</Button>
					</legend>

					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={banner.enabled}
							onChange={(e) => updateBanner(index, { enabled: e.target.checked })}
							className="size-4"
						/>
						Aktywny
					</label>

					<div className="flex flex-col gap-2">
						<span className="text-xs font-medium text-muted-foreground">Podstrony</span>
						<div className="flex flex-wrap gap-2">
							{PAGE_OPTIONS.map((option) => (
								<label
									key={option.id}
									className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
								>
									<input
										type="checkbox"
										checked={banner.pageIds.includes(option.id)}
										onChange={(e) => togglePage(index, option.id, e.target.checked)}
										className="size-3.5"
									/>
									{option.label}
								</label>
							))}
						</div>
					</div>

					<Input
						value={banner.title ?? ""}
						onChange={(e) => updateBanner(index, { title: e.target.value })}
						placeholder="Nagłówek"
						className="h-10"
					/>
					<textarea
						value={banner.body ?? ""}
						onChange={(e) => updateBanner(index, { body: e.target.value })}
						placeholder="Treść (opcjonalnie)"
						rows={3}
						className={inputClass}
					/>
					<div className="grid gap-3 sm:grid-cols-2">
						<Input
							value={banner.link ?? ""}
							onChange={(e) => updateBanner(index, { link: e.target.value })}
							placeholder="Link (np. /sklep)"
							className="h-10"
						/>
						<Input
							value={banner.linkLabel ?? ""}
							onChange={(e) => updateBanner(index, { linkLabel: e.target.value })}
							placeholder="Etykieta przycisku"
							className="h-10"
						/>
					</div>

					<OgImageField
						label="Zdjęcie"
						value={banner.imageUrl ?? ""}
						onChange={(url) => updateBanner(index, { imageUrl: url })}
						description="Opcjonalne. Po zapisie tekst jest live; obraz — po Redeploy."
					/>

					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={banner.blurBackground !== false}
							onChange={(e) => updateBanner(index, { blurBackground: e.target.checked })}
							className="size-4"
						/>
						Blur tła strony (domyślnie włączony)
					</label>

					<div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-3">
						<span className="text-xs font-medium text-muted-foreground">Pasek po schowaniu (lewa krawędź)</span>
						<Input
							value={banner.tabLabel ?? ""}
							onChange={(e) => updateBanner(index, { tabLabel: e.target.value })}
							placeholder={DEFAULT_POPUP_TAB_LABEL}
							className="h-10"
							maxLength={24}
						/>
						<p className="text-[11px] text-muted-foreground">
							Tekst pionowy na pasku. Domyślnie: „{DEFAULT_POPUP_TAB_LABEL}”.
						</p>
						<div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
							{POPUP_BANNER_TAB_ICON_OPTIONS.map((option) => {
								const selected =
									resolvePopupTabIcon(banner.tabIcon) === option.id;
								return (
									<button
										key={option.id}
										type="button"
										onClick={() => updateBanner(index, { tabIcon: option.id as TabIcon })}
										className={cn(
											"flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
											selected
												? "border-primary bg-primary/10 text-foreground"
												: "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
										)}
										aria-pressed={selected}
										aria-label={`Ikona: ${option.label}`}
									>
										<PopupBannerTabIcon icon={option.id} className="size-4" />
										<span className="leading-tight">{option.label}</span>
									</button>
								);
							})}
						</div>
						<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
							<span>Podgląd:</span>
							<span className="inline-flex items-center gap-1 rounded-r-md border border-l-0 border-border bg-brand-800 px-2 py-1.5 text-[#fffdf8]">
								<PopupBannerTabIcon
									icon={resolvePopupTabIcon(banner.tabIcon)}
									className="size-3.5"
								/>
								<span className="text-[9px] font-semibold uppercase tracking-wide">
									{resolvePopupTabLabel(banner.tabLabel)}
								</span>
							</span>
						</div>
					</div>
				</fieldset>
			))}

			<Button type="button" variant="outline" onClick={addBanner} className="w-fit gap-2">
				<Plus className="size-4" aria-hidden />
				Dodaj baner
			</Button>

			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			{successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}

			<Button type="submit" disabled={pending} className="w-fit gap-2">
				{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
				Zapisz banery
			</Button>

			<p className="text-xs text-muted-foreground">
				Po schowaniu baner wraca po kliknięciu paska z lewej krawędzi (tekst i ikona konfigurowalne).
			</p>
		</form>
	);
}
