"use client";

import { useCallback, useState, useTransition } from "react";
import {
	ChevronDown,
	ChevronUp,
	Copy,
	Eye,
	EyeOff,
	Plus,
	Save,
	Trash2,
	Upload,
} from "lucide-react";
import { Button } from "@magazyn/core/ui/button";
import { cn } from "@magazyn/core/lib/cn";
import type { ContentPageId } from "@/lib/content/types";
import type { PageSection, SectionTypeId } from "@/lib/composer/sections/schema";
import { SECTION_REGISTRY, SECTION_REGISTRY_MAP, createSection } from "@/lib/composer/registry";
import { DEFAULT_SECTION_LAYOUT, type SectionLayout } from "@/lib/composer/sections/layout";
import {
	publishPageSectionsAction,
	restorePageSectionsVersionAction,
	savePageSectionsDraftAction,
} from "@/magazyn/modules/content/content-actions";
import type { SectionHistory } from "@/lib/composer/sections/schema";
import { CMS_PREVIEW_RELOAD } from "@/lib/cms-preview/messages";
import type { CmsProductOption } from "@/magazyn/modules/content/product-options";
import { applyPreset, presetsForPage } from "@/lib/composer/presets";

type Props = {
	pageId: ContentPageId;
	pagePath: string;
	initialSections: PageSection[];
	history: SectionHistory;
	productOptions: CmsProductOption[];
	onSaved?: () => void;
};

function moveItem<T>(list: T[], from: number, to: number): T[] {
	const next = [...list];
	const item = next[from];
	if (item === undefined) return list;
	next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}

export function SectionsEditor({
	pageId,
	pagePath,
	initialSections,
	history,
	productOptions,
	onSaved,
}: Props) {
	const [sections, setSections] = useState<PageSection[]>(initialSections);
	const [selectedId, setSelectedId] = useState<string | null>(initialSections[0]?.id ?? null);
	const [catalogOpen, setCatalogOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const selected = sections.find((s) => s.id === selectedId) ?? null;

	const notifyIframe = useCallback(() => {
		const iframe = document.querySelector<HTMLIFrameElement>('iframe[title*="Podgląd"]');
		iframe?.contentWindow?.postMessage({ type: CMS_PREVIEW_RELOAD }, window.location.origin);
	}, []);

	function updateSection(id: string, patch: Partial<PageSection>) {
		setSections((prev) => prev.map((s) => (s.id === id ? ({ ...s, ...patch } as PageSection) : s)));
	}

	function updateLayout(id: string, layout: Partial<SectionLayout>) {
		setSections((prev) =>
			prev.map((s) =>
				s.id === id
					? { ...s, layout: { ...(s.layout ?? DEFAULT_SECTION_LAYOUT), ...layout } }
					: s,
			),
		);
	}

	function updateProps(id: string, props: Record<string, unknown>) {
		setSections((prev) =>
			prev.map((s) => (s.id === id ? ({ ...s, props: { ...s.props, ...props } } as PageSection) : s)),
		);
	}

	function handleSaveDraft() {
		startTransition(async () => {
			const res = await savePageSectionsDraftAction(pageId, pagePath, sections);
			setMessage(res.ok ? "Szkic zapisany." : (res.error ?? "Błąd zapisu."));
			if (res.ok) {
				notifyIframe();
				onSaved?.();
			}
		});
	}

	function handlePublish() {
		startTransition(async () => {
			const res = await publishPageSectionsAction(pageId, pagePath, sections);
			setMessage(res.ok ? "Opublikowano na produkcji." : (res.error ?? "Błąd publikacji."));
			if (res.ok) {
				notifyIframe();
				onSaved?.();
			}
		});
	}

	function handleRestore(versionIndex: number) {
		startTransition(async () => {
			const res = await restorePageSectionsVersionAction(pageId, pagePath, versionIndex);
			setMessage(res.ok ? "Przywrócono wersję." : (res.error ?? "Błąd przywracania."));
			if (res.ok) {
				notifyIframe();
				onSaved?.();
			}
		});
	}

	return (
		<div className="flex flex-col gap-4" data-cms-input={`page.${pageId}.sections`}>
			<div className="flex flex-wrap items-center gap-2">
				<Button type="button" size="sm" variant="outline" onClick={() => setCatalogOpen((v) => !v)}>
					<Plus className="size-4" />
					Dodaj sekcję
				</Button>
				<Button type="button" size="sm" onClick={handleSaveDraft} disabled={pending}>
					<Save className="size-4" />
					Zapisz szkic
				</Button>
				<Button type="button" size="sm" variant="default" onClick={handlePublish} disabled={pending}>
					<Upload className="size-4" />
					Opublikuj
				</Button>
			</div>

			{catalogOpen ? (
				<div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-3">
					{SECTION_REGISTRY.map((entry) => (
						<button
							key={entry.type}
							type="button"
							className="rounded-lg border border-border bg-background p-3 text-left text-sm hover:border-brand-500"
							onClick={() => {
								const created = createSection(entry.type);
								setSections((prev) => [...prev, created]);
								setSelectedId(created.id);
								setCatalogOpen(false);
							}}
						>
							<p className="font-medium">{entry.label}</p>
							<p className="text-xs text-muted-foreground">{entry.preview}</p>
						</button>
					))}
				</div>
			) : null}

			{presetsForPage(pageId).length > 0 ? (
				<fieldset className="rounded-xl border border-border p-3">
					<legend className="px-1 text-sm font-medium">Presety strony</legend>
					<div className="flex flex-wrap gap-2">
						{presetsForPage(pageId).map((preset) => (
							<Button
								key={preset.id}
								type="button"
								size="sm"
								variant="outline"
								onClick={() => {
									setSections(applyPreset(preset));
									setSelectedId(null);
									setMessage(`Zastosowano preset: ${preset.label}`);
								}}
							>
								{preset.label}
							</Button>
						))}
					</div>
				</fieldset>
			) : null}

			<ul className="flex flex-col gap-2">
				{sections.map((section, index) => {
					const meta = SECTION_REGISTRY_MAP[section.type];
					return (
						<li
							key={section.id}
							className={cn(
								"rounded-xl border p-3",
								selectedId === section.id ? "border-brand-500 bg-brand-50/40" : "border-border",
								section.hidden && "opacity-60",
							)}
						>
							<div className="flex items-center justify-between gap-2">
								<button
									type="button"
									className="text-left text-sm font-medium"
									onClick={() => setSelectedId(section.id)}
									data-cms-input={`page.${pageId}.sections.${section.id}`}
								>
									{meta?.label ?? section.type}
									{section.hidden ? " (ukryta)" : ""}
								</button>
								<div className="flex shrink-0 gap-1">
									<Button
										type="button"
										size="icon"
										variant="ghost"
										aria-label="W górę"
										disabled={index === 0}
										onClick={() => setSections(moveItem(sections, index, index - 1))}
									>
										<ChevronUp className="size-4" />
									</Button>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										aria-label="W dół"
										disabled={index === sections.length - 1}
										onClick={() => setSections(moveItem(sections, index, index + 1))}
									>
										<ChevronDown className="size-4" />
									</Button>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										aria-label={section.hidden ? "Pokaż" : "Ukryj"}
										onClick={() => updateSection(section.id, { hidden: !section.hidden })}
									>
										{section.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
									</Button>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										aria-label="Duplikuj"
										onClick={() => {
											const copy = createSection(section.type);
											const dup = {
												...copy,
												props: structuredClone(section.props),
												layout: section.layout,
											} as PageSection;
											setSections((prev) => {
												const next = [...prev];
												next.splice(index + 1, 0, dup);
												return next;
											});
											setSelectedId(dup.id);
										}}
									>
										<Copy className="size-4" />
									</Button>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										aria-label="Usuń"
										onClick={() => {
											setSections((prev) => prev.filter((s) => s.id !== section.id));
											if (selectedId === section.id) setSelectedId(null);
										}}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							</div>
						</li>
					);
				})}
			</ul>

			{selected ? (
				<SectionFieldsEditor
					section={selected}
					pageId={pageId}
					productOptions={productOptions}
					onLayoutChange={(layout) => updateLayout(selected.id, layout)}
					onPropsChange={(props) => updateProps(selected.id, props)}
				/>
			) : null}

			{history.versions.length > 0 ? (
				<fieldset className="rounded-xl border border-border p-4">
					<legend className="px-1 text-sm font-medium">Historia publikacji</legend>
					<ul className="flex flex-col gap-2">
						{history.versions.map((v, i) => (
							<li key={v.savedAt} className="flex items-center justify-between text-sm">
								<span>{new Date(v.savedAt).toLocaleString("pl-PL")}</span>
								<Button type="button" size="sm" variant="outline" onClick={() => handleRestore(i)}>
									Przywróć
								</Button>
							</li>
						))}
					</ul>
				</fieldset>
			) : null}

			{message ? (
				<p role="status" className="text-sm text-emerald-700">
					{message}
				</p>
			) : null}
		</div>
	);
}

function SectionFieldsEditor({
	section,
	pageId,
	productOptions,
	onLayoutChange,
	onPropsChange,
}: {
	section: PageSection;
	pageId: ContentPageId;
	productOptions: CmsProductOption[];
	onLayoutChange: (layout: Partial<SectionLayout>) => void;
	onPropsChange: (props: Record<string, unknown>) => void;
}) {
	const layout = section.layout ?? DEFAULT_SECTION_LAYOUT;
	const inputClass =
		"w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

	return (
		<div className="flex flex-col gap-4 rounded-xl border border-border p-4">
			<p className="text-sm font-medium">Układ sekcji</p>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<label className="flex flex-col gap-1">
					Wyrównanie
					<select
						value={layout.align}
						onChange={(e) => onLayoutChange({ align: e.target.value as SectionLayout["align"] })}
						className={inputClass}
					>
						<option value="left">Lewo</option>
						<option value="center">Środek</option>
						<option value="right">Prawo</option>
					</select>
				</label>
				<label className="flex flex-col gap-1">
					Rozmiar
					<select
						value={layout.size}
						onChange={(e) => onLayoutChange({ size: e.target.value as SectionLayout["size"] })}
						className={inputClass}
					>
						<option value="sm">Mały</option>
						<option value="md">Średni</option>
						<option value="lg">Duży</option>
					</select>
				</label>
				<label className="flex flex-col gap-1">
					Kolumny
					<select
						value={layout.columns}
						onChange={(e) =>
							onLayoutChange({ columns: e.target.value as SectionLayout["columns"] })
						}
						className={inputClass}
					>
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="3">3</option>
						<option value="4">4</option>
					</select>
				</label>
				<label className="flex flex-col gap-1">
					Odstępy
					<select
						value={layout.spacing}
						onChange={(e) =>
							onLayoutChange({ spacing: e.target.value as SectionLayout["spacing"] })
						}
						className={inputClass}
					>
						<option value="sm">Małe</option>
						<option value="md">Średnie</option>
						<option value="lg">Duże</option>
					</select>
				</label>
			</div>

			{section.type === "hero" && section.props ? (
				<>
					<label className="flex flex-col gap-1 text-sm">
						Nagłówek (H1)
						<input
							className={inputClass}
							value={section.props.headline}
							data-cms-input={`page.${pageId}.sections.${section.id}.headline`}
							data-cms-inline="text"
							onChange={(e) => onPropsChange({ headline: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						Opis
						<textarea
							className={inputClass}
							rows={3}
							value={section.props.description}
							onChange={(e) => onPropsChange({ description: e.target.value })}
						/>
					</label>
				</>
			) : null}

			{section.type === "richText" ? (
				<label className="flex flex-col gap-1 text-sm">
					Treść HTML
					<textarea
						className={inputClass}
						rows={5}
						value={section.props.bodyHtml}
						onChange={(e) => onPropsChange({ bodyHtml: e.target.value })}
					/>
				</label>
			) : null}

			{section.type === "bestsellers" ? (
				<label className="flex flex-col gap-1 text-sm">
					Produkty (max 4)
					<select
						multiple
						className={inputClass}
						value={section.props.productIds}
						onChange={(e) => {
							const ids = Array.from(e.target.selectedOptions).map((o) => o.value).slice(0, 4);
							onPropsChange({ productIds: ids });
						}}
					>
						{productOptions.map((p) => (
							<option key={p.id} value={p.id}>
								{p.title}
							</option>
						))}
					</select>
				</label>
			) : null}

			{section.type === "cta" ? (
				<>
					<label className="flex flex-col gap-1 text-sm">
						Nagłówek
						<input
							className={inputClass}
							value={section.props.heading ?? ""}
							onChange={(e) => onPropsChange({ heading: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						Podtytuł
						<input
							className={inputClass}
							value={section.props.subheading ?? ""}
							onChange={(e) => onPropsChange({ subheading: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						Etykieta CTA
						<input
							className={inputClass}
							value={section.props.ctaLabel ?? ""}
							onChange={(e) => onPropsChange({ ctaLabel: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						Link CTA
						<input
							className={inputClass}
							value={section.props.ctaHref ?? ""}
							onChange={(e) => onPropsChange({ ctaHref: e.target.value })}
						/>
					</label>
				</>
			) : null}

			{section.type === "textImage" ? (
				<>
					<label className="flex flex-col gap-1 text-sm">
						Nagłówek
						<input
							className={inputClass}
							value={section.props.heading ?? ""}
							onChange={(e) => onPropsChange({ heading: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						Treść
						<textarea
							className={inputClass}
							rows={4}
							value={section.props.body ?? ""}
							onChange={(e) => onPropsChange({ body: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						URL obrazu
						<input
							className={inputClass}
							value={section.props.imageUrl ?? ""}
							onChange={(e) => onPropsChange({ imageUrl: e.target.value })}
						/>
					</label>
					<label className="flex flex-col gap-1 text-sm">
						Alt obrazu
						<input
							className={inputClass}
							value={section.props.imageAlt ?? ""}
							onChange={(e) => onPropsChange({ imageAlt: e.target.value })}
						/>
					</label>
					{!section.props.imageAlt?.trim() && section.props.imageUrl ? (
						<p role="status" className="text-xs text-amber-700">
							Brak opisu alt — dodaj dla dostępności (WCAG).
						</p>
					) : null}
				</>
			) : null}

			{section.type === "gallery" ? (
				<p role="status" className="text-xs text-muted-foreground">
					Galeria: {section.props.items.length} zdjęć.
					{section.props.items.some((i) => !i.alt?.trim()) ? (
						<span className="text-amber-700"> Niektóre zdjęcia bez alt.</span>
					) : null}
				</p>
			) : null}

			{section.type === "embedMap" ? (
				<label className="flex flex-col gap-1 text-sm">
					URL osadzenia mapy
					<input
						className={inputClass}
						value={section.props.embedUrl}
						onChange={(e) => onPropsChange({ embedUrl: e.target.value })}
					/>
				</label>
			) : null}
		</div>
	);
}
