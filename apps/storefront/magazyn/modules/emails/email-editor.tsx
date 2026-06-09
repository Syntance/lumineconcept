"use client";

import { Loader2, Monitor, Plus, RotateCcw, Save, Send, Smartphone } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { cn } from "@magazyn/core/lib/cn";
import { renderTemplate, sampleRenderContextForTemplate } from "./render-template";
import {
	type Block,
	type EmailTemplate,
	type EmailTemplateType,
	getMergeVariablesForTemplate,
	isContactEmailTemplateType,
	isEmailTemplateEnabled,
} from "./template-types";
import {
	resetTemplateAction,
	saveTemplateAction,
	sendTestEmailAction,
	setTemplateEnabledAction,
	uploadEmailImageAction,
} from "./actions";
import { BLOCK_META, createBlock, duplicateBlock, PALETTE_BLOCKS } from "./block-meta";
import { BlockInspector, type ImageUploader } from "./block-inspector";
import { editorBtnRounded, segmentItem, segmentItemActive, segmentItemIdle, segmentTrack } from "./editor-chrome";
import { EditorCanvas } from "./editor-canvas";
import { EmailTemplatePicker, enabledByTypeFromTemplates } from "./email-template-picker";
import { ThemePanel } from "./theme-panel";

type Feedback = { type: "ok" | "err"; text: string } | null;

function toRecord(templates: EmailTemplate[]): Record<EmailTemplateType, EmailTemplate> {
	const record = {} as Record<EmailTemplateType, EmailTemplate>;
	for (const template of templates) record[template.type] = template;
	return record;
}

export function EmailEditor({ initialTemplates }: { initialTemplates: EmailTemplate[] }) {
	const [templates, setTemplates] = useState(() => toRecord(initialTemplates));
	const [activeType, setActiveType] = useState<EmailTemplateType>(initialTemplates[0]?.type ?? "placed");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [leftPanelTab, setLeftPanelTab] = useState<"block" | "theme">("theme");
	const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
	const [testEmail, setTestEmail] = useState("");
	const [feedback, setFeedback] = useState<Feedback>(null);
	const [saving, startSave] = useTransition();
	const [resetting, startReset] = useTransition();
	const [testing, startTest] = useTransition();
	const [togglingType, setTogglingType] = useState<EmailTemplateType | null>(null);

	const active = templates[activeType];
	const activeEnabled = isEmailTemplateEnabled(active);

	const templateList = useMemo(() => Object.values(templates), [templates]);
	const enabledByType = useMemo(() => enabledByTypeFromTemplates(templateList), [templateList]);

	const selectedBlock = useMemo(
		() => active.blocks.find((b) => b.id === selectedId) ?? null,
		[active.blocks, selectedId],
	);

	const mergeVariables = useMemo(() => getMergeVariablesForTemplate(activeType), [activeType]);

	const preview = useMemo(
		() => renderTemplate(active, sampleRenderContextForTemplate(activeType)).html,
		[active, activeType],
	);

	function updateActive(updater: (t: EmailTemplate) => EmailTemplate) {
		setTemplates((prev) => ({ ...prev, [activeType]: updater(prev[activeType]) }));
	}

	function setBlocks(blocks: Block[]) {
		updateActive((t) => ({ ...t, blocks }));
	}

	function selectBlock(id: string) {
		setSelectedId(id);
		setLeftPanelTab("block");
	}

	function addBlock(type: Block["type"]) {
		const block = createBlock(type);
		updateActive((t) => ({ ...t, blocks: [...t.blocks, block] }));
		selectBlock(block.id);
	}

	function updateBlock(id: string, next: Block) {
		updateActive((t) => ({ ...t, blocks: t.blocks.map((b) => (b.id === id ? next : b)) }));
	}

	function onDuplicate(id: string) {
		const source = active.blocks.find((b) => b.id === id);
		if (!source) return;
		const copy = duplicateBlock(source);
		const index = active.blocks.findIndex((b) => b.id === id);
		const blocks = [...active.blocks];
		blocks.splice(index + 1, 0, copy);
		setBlocks(blocks);
		selectBlock(copy.id);
	}

	function onDelete(id: string) {
		updateActive((t) => ({ ...t, blocks: t.blocks.filter((b) => b.id !== id) }));
		if (selectedId === id) setSelectedId(null);
	}

	const switchTemplate = useCallback((type: EmailTemplateType) => {
		setActiveType(type);
		setSelectedId(null);
		setLeftPanelTab("theme");
		setFeedback(null);
	}, []);

	const onToggleEnabled = useCallback((type: EmailTemplateType, enabled: boolean) => {
		setFeedback(null);
		setTogglingType(type);
		void (async () => {
			const result = await setTemplateEnabledAction({ type, enabled });
			setTogglingType(null);
			if (result.ok && result.template) {
				setTemplates((prev) => ({
					...prev,
					[type]: result.template as EmailTemplate,
				}));
				setFeedback({
					type: "ok",
					text: enabled
						? "Wysyłka tego e-maila włączona."
						: "Wysyłka tego e-maila wyłączona — klient nie dostanie go automatycznie.",
				});
			} else {
				setFeedback({
					type: "err",
					text: result.error ?? "Nie udało się zapisać ustawienia.",
				});
			}
		})();
	}, []);

	const uploadImage: ImageUploader = async (file) => {
		const formData = new FormData();
		formData.append("file", file);
		const result = await uploadEmailImageAction(formData);
		return result.ok ? { url: result.url } : { error: result.error ?? "Błąd uploadu." };
	};

	function onSave() {
		setFeedback(null);
		startSave(async () => {
			const result = await saveTemplateAction({
				...active,
				enabled: active.enabled ?? true,
			});
			setFeedback(
				result.ok
					? { type: "ok", text: "Szablon zapisany — nadpisze wysyłki tego etapu." }
					: { type: "err", text: result.error ?? "Nie udało się zapisać." },
			);
		});
	}

	function onReset() {
		if (!window.confirm("Przywrócić domyślny szablon? Twoje zmiany tego maila zostaną usunięte.")) return;
		setFeedback(null);
		startReset(async () => {
			const result = await resetTemplateAction(activeType);
			if (result.ok && result.template) {
				setTemplates((prev) => ({ ...prev, [activeType]: result.template as EmailTemplate }));
				setSelectedId(null);
				setFeedback({ type: "ok", text: "Przywrócono domyślny szablon." });
			} else {
				setFeedback({ type: "err", text: result.error ?? "Nie udało się przywrócić." });
			}
		});
	}

	function onTest() {
		setFeedback(null);
		startTest(async () => {
			const result = await sendTestEmailAction({ to: testEmail, template: active });
			setFeedback(
				result.ok
					? { type: "ok", text: `Wysłano test na ${testEmail}.` }
					: { type: "err", text: result.error ?? "Nie udało się wysłać testu." },
			);
		});
	}

	function insertVariable(token: string) {
		updateActive((t) => ({ ...t, subject: `${t.subject}{{${token}}}` }));
	}

	const busy = saving || resetting || testing || togglingType !== null;

	const previewMaxWidth = previewMode === "mobile" ? 390 : (active.theme.contentWidth + 80) * 2;

	return (
		<div className="flex flex-col gap-4">
			<EmailTemplatePicker
				activeType={activeType}
				onSelect={switchTemplate}
				enabledByType={enabledByType}
				onToggleEnabled={onToggleEnabled}
				togglingType={togglingType}
			/>

			{!activeEnabled ? (
				<p
					role="status"
					className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground"
				>
					Wysyłka automatyczna wyłączona dla tego szablonu. Możesz edytować treść i włączyć ją suwakiem w
					liście powyżej.
				</p>
			) : null}

			<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="email-subject" className="text-sm font-medium">
						Temat wiadomości
					</label>
					<Input
						id="email-subject"
						value={active.subject}
						onChange={(e) => updateActive((t) => ({ ...t, subject: e.target.value }))}
						className="h-10"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					<span className="text-xs text-muted-foreground">Wstaw zmienną:</span>
					{mergeVariables.map((v) => (
						<button
							key={v.token}
							type="button"
							onClick={() => insertVariable(v.token)}
							title={v.label}
							className={cn(
								editorBtnRounded,
								"border border-input px-2 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
							)}
						>
							{`{{${v.token}}}`}
						</button>
					))}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
					<div className="flex flex-1 items-center gap-2">
						<Input
							type="email"
							value={testEmail}
							onChange={(e) => setTestEmail(e.target.value)}
							placeholder="adres@do-testu.pl"
							className="h-9 max-w-56"
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={busy || !testEmail.includes("@")}
							onClick={onTest}
							className="gap-1.5"
						>
							{testing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
							Wyślij test
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onReset} className="gap-1.5">
							{resetting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}
							Przywróć domyślny
						</Button>
						<Button type="button" size="sm" disabled={busy} onClick={onSave} className="gap-1.5">
							{saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
							Zapisz
						</Button>
					</div>
				</div>

				{feedback ? (
					<p
						role={feedback.type === "err" ? "alert" : "status"}
						className={cn("text-sm", feedback.type === "err" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}
					>
						{feedback.text}
					</p>
				) : null}
			</div>

			<div className="grid gap-4 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
						<div className={cn(segmentTrack, "w-full")}>
							<button
								type="button"
								onClick={() => setLeftPanelTab("block")}
								aria-pressed={leftPanelTab === "block"}
								className={cn(
									"flex-1 px-3 py-1.5 text-sm font-medium",
									segmentItem,
									leftPanelTab === "block" ? segmentItemActive : segmentItemIdle,
								)}
							>
								Blok
							</button>
							<button
								type="button"
								onClick={() => setLeftPanelTab("theme")}
								aria-pressed={leftPanelTab === "theme"}
								className={cn(
									"flex-1 px-3 py-1.5 text-sm font-medium",
									segmentItem,
									leftPanelTab === "theme" ? segmentItemActive : segmentItemIdle,
								)}
							>
								Motyw
							</button>
						</div>

						{leftPanelTab === "theme" ? (
							<ThemePanel theme={active.theme} onChange={(theme) => updateActive((t) => ({ ...t, theme }))} />
						) : selectedBlock ? (
							<BlockInspector block={selectedBlock} onUpload={uploadImage} onChange={(next) => updateBlock(selectedBlock.id, next)} />
						) : (
							<p className="text-sm text-muted-foreground">Zaznacz blok na liście poniżej, aby edytować jego treść i styl.</p>
						)}
					</div>

					<div className="rounded-xl border border-border bg-card p-3">
						<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dodaj blok</h3>
						<div className="grid grid-cols-2 gap-1.5">
							{PALETTE_BLOCKS.map((type) => {
								const Icon = BLOCK_META[type].icon;
								return (
									<button
										key={type}
										type="button"
										onClick={() => addBlock(type)}
										className={cn(
											editorBtnRounded,
											"inline-flex items-center gap-1.5 border border-input px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
										)}
									>
										<Icon className="size-3.5 text-muted-foreground" aria-hidden />
										<span className="truncate">{BLOCK_META[type].label}</span>
									</button>
								);
							})}
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card p-3">
						<div className="mb-2 flex items-center justify-between">
							<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bloki ({active.blocks.length})</h3>
							<Plus className="size-3.5 text-muted-foreground" aria-hidden />
						</div>
						<EditorCanvas
							blocks={active.blocks}
							selectedId={selectedId}
							onSelect={selectBlock}
							onReorder={setBlocks}
							onDuplicate={onDuplicate}
							onDelete={onDelete}
						/>
					</div>
				</div>

				<div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-muted/20 p-3">
					<div className="flex items-center justify-between">
						<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Podgląd (
							{isContactEmailTemplateType(activeType)
								? "przykładowy formularz"
								: activeType === "bank_transfer_pending"
									? "przelew tradycyjny"
									: "przykładowe zamówienie"}
							)
						</h3>
						<div className={segmentTrack}>
							<button
								type="button"
								aria-label="Podgląd desktop"
								aria-pressed={previewMode === "desktop"}
								onClick={() => setPreviewMode("desktop")}
								className={cn(
									"inline-flex size-7 items-center justify-center",
									segmentItem,
									previewMode === "desktop" ? segmentItemActive : segmentItemIdle,
								)}
							>
								<Monitor className="size-4" aria-hidden />
							</button>
							<button
								type="button"
								aria-label="Podgląd mobilny"
								aria-pressed={previewMode === "mobile"}
								onClick={() => setPreviewMode("mobile")}
								className={cn(
									"inline-flex size-7 items-center justify-center",
									segmentItem,
									previewMode === "mobile" ? segmentItemActive : segmentItemIdle,
								)}
							>
								<Smartphone className="size-4" aria-hidden />
							</button>
						</div>
					</div>
					<div className="flex justify-center overflow-x-auto overflow-y-hidden">
						<iframe
							title="Podgląd maila"
							srcDoc={preview}
							sandbox=""
							className="h-[720px] shrink-0 rounded-lg border border-border bg-white transition-all"
							style={{ width: previewMaxWidth, maxWidth: "100%" }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
