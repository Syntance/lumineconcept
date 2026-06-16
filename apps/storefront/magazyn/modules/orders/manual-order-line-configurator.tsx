"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileUploadSection, type UploadedFile } from "@/components/product/FileUploadSection";
import { CUSTOM_COLOR_VALUE, isMatAllowed } from "@/components/product/ProductVariantSelector";
import { cn } from "@magazyn/core/lib/cn";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { ColorSwatch } from "@magazyn/modules/products/color-ui";
import type { ManualOrderProductConfig } from "./create-order-types";
import {
	buildManualOrderLineMetadata,
	createEmptyLineConfigState,
	summarizeLineConfig,
	validateManualOrderLineConfig,
	type ManualOrderColorState,
	type ManualOrderLineConfigState,
} from "./manual-order-line-metadata";

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
	open: boolean;
	config: ManualOrderProductConfig | null;
	loading: boolean;
	loadError: string | null;
	onClose: () => void;
	onConfirm: (payload: { metadata: Record<string, string>; summary: string; lineNote?: string }) => void;
};

function ColorField({
	label,
	colors,
	allowCustom,
	state,
	onChange,
	colorMap,
	matDisabledSet,
}: {
	label: string;
	colors: ManualOrderProductConfig["colorsBySlot"][string];
	allowCustom: boolean;
	state: ManualOrderColorState;
	onChange: (next: ManualOrderColorState) => void;
	colorMap: Record<string, string>;
	matDisabledSet: Set<string>;
}) {
	const selectId = useId();
	const showMat =
		state.selected &&
		state.selected !== CUSTOM_COLOR_VALUE &&
		isMatAllowed(state.selected, matDisabledSet);

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3">
			<label htmlFor={selectId} className="text-sm font-medium text-foreground">
				{label}
			</label>
			<select
				id={selectId}
				value={state.selected}
				onChange={(event) => {
					const selected = event.target.value;
					onChange({
						selected,
						customHex: selected === CUSTOM_COLOR_VALUE ? state.customHex ?? "#000000" : null,
						matFinish: selected === CUSTOM_COLOR_VALUE ? false : state.matFinish,
					});
				}}
				className={inputClass}
				required={colors.length > 0}
			>
				<option value="">— wybierz —</option>
				{colors.map((color) => (
					<option key={color.name} value={color.name}>
						{color.name}
					</option>
				))}
				{allowCustom ? <option value={CUSTOM_COLOR_VALUE}>Własny kolor (HEX)</option> : null}
			</select>

			{state.selected ? (
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<ColorSwatch hex={state.selected === CUSTOM_COLOR_VALUE ? state.customHex : colorMap[state.selected.toLowerCase()] ?? null} />
					<span>{state.selected === CUSTOM_COLOR_VALUE ? "Kolor własny" : state.selected}</span>
				</div>
			) : null}

			{state.selected === CUSTOM_COLOR_VALUE && allowCustom ? (
				<label className="flex flex-col gap-1 text-sm">
					<span className="font-medium">HEX</span>
					<Input
						value={state.customHex ?? ""}
						onChange={(event) => onChange({ ...state, customHex: event.target.value })}
						placeholder="#RRGGBB"
						pattern="^#[0-9A-Fa-f]{6}$"
						required
					/>
				</label>
			) : null}

			{showMat ? (
				<label className="inline-flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={state.matFinish}
						onChange={(event) => onChange({ ...state, matFinish: event.target.checked })}
						className="size-4 rounded border-border accent-primary"
					/>
					Wykończenie matowe
				</label>
			) : null}
		</div>
	);
}

export function ManualOrderLineConfigurator({
	open,
	config,
	loading,
	loadError,
	onClose,
	onConfirm,
}: Props) {
	const titleId = useId();
	const [state, setState] = useState<ManualOrderLineConfigState | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !config) {
			setState(null);
			setValidationError(null);
			return;
		}
		setState(createEmptyLineConfigState(config));
		setValidationError(null);
	}, [open, config]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !loading) onClose();
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [open, loading, onClose]);

	const matDisabledSet = useMemo(
		() => new Set(config?.matDisabledSet.map((name) => name.toLowerCase()) ?? []),
		[config?.matDisabledSet],
	);

	const uploadedForSection: UploadedFile[] = useMemo(() => {
		if (!state) return [];
		return state.uploadedFiles
			.filter((file): file is { url: string; filename: string } => !!file?.url)
			.map((file) => ({ url: file.url, filename: file.filename, size: 0 }));
	}, [state]);

	if (!open || typeof document === "undefined") return null;

	function handleConfirm() {
		if (!config || !state) return;
		const error = validateManualOrderLineConfig(config, state);
		if (error) {
			setValidationError(error);
			return;
		}
		const metadata = buildManualOrderLineMetadata(config, state);
		onConfirm({
			metadata,
			summary: summarizeLineConfig(config, metadata),
			lineNote: state.lineNote.trim() || undefined,
		});
	}

	return createPortal(
		<div
			className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
		>
			<button
				type="button"
				className="fixed inset-0 bg-foreground/40 backdrop-blur-[2px] motion-reduce:backdrop-blur-none"
				onClick={loading ? undefined : onClose}
				aria-label="Zamknij"
				tabIndex={-1}
			/>
			<div className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border border-border bg-card shadow-xl sm:rounded-xl">
				<div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
					<div className="min-w-0">
						<h2 id={titleId} className="font-serif text-lg font-semibold text-foreground">
							Konfiguracja produktu
						</h2>
						<p className="mt-1 truncate text-sm text-muted-foreground">{config?.title ?? "Ładowanie…"}</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label="Zamknij"
					>
						<X className="size-4" aria-hidden />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-4">
					{loading ? (
						<p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" aria-hidden />
							Ładuję konfigurację produktu…
						</p>
					) : loadError ? (
						<p className="py-8 text-sm text-destructive">{loadError}</p>
					) : !config || !state ? null : (
						<div className="flex flex-col gap-4">
							{config.colorSlotTitles.map((title) => {
								const colors = config.colorsBySlot[title] ?? [];
								if (colors.length === 0) return null;
								return (
									<ColorField
										key={title}
										label={title}
										colors={colors}
										allowCustom={config.allowCustomBySlot[title] ?? false}
										state={state.colorStates[title] ?? { selected: "", customHex: null, matFinish: false }}
										onChange={(next) =>
											setState((current) =>
												current
													? { ...current, colorStates: { ...current.colorStates, [title]: next } }
													: current,
											)
										}
										colorMap={config.colorMap}
										matDisabledSet={matDisabledSet}
									/>
								);
							})}

							{config.standAvailable ? (
								<div className="flex flex-col gap-3">
									<label className="inline-flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={state.includeStand}
											onChange={(event) =>
												setState((current) =>
													current ? { ...current, includeStand: event.target.checked } : current,
												)
											}
											className="size-4 rounded border-border accent-primary"
										/>
										Podstawka certyfikatu
									</label>
									{state.includeStand ? (
										<ColorField
											label={config.standColorOptionTitle}
											colors={config.standColors}
											allowCustom={config.standAllowCustom}
											state={state.standColorState}
											onChange={(next) =>
												setState((current) => (current ? { ...current, standColorState: next } : current))
											}
											colorMap={config.colorMap}
											matDisabledSet={matDisabledSet}
										/>
									) : null}
								</div>
							) : null}

							{config.textFields.length > 0 ? (
								<div className="flex flex-col gap-3">
									<p className="text-sm font-medium text-foreground">Pola tekstowe</p>
									{config.textFields.map((field) => (
										<label key={field.key} className="flex flex-col gap-1.5 text-sm">
											<span className="font-medium">
												{field.label}
												{field.required ? " *" : ""}
											</span>
											{field.hint ? <span className="text-xs text-muted-foreground">{field.hint}</span> : null}
											<Input
												value={state.textFieldValues[field.key] ?? ""}
												onChange={(event) =>
													setState((current) =>
														current
															? {
																	...current,
																	textFieldValues: {
																		...current.textFieldValues,
																		[field.key]: event.target.value,
																	},
																}
															: current,
													)
												}
												placeholder={field.placeholder}
												maxLength={field.maxLength}
												required={field.required}
											/>
										</label>
									))}
								</div>
							) : null}

							{config.linksCount > 0 ? (
								<div className="flex flex-col gap-3">
									<p className="text-sm font-medium text-foreground">
										{config.linksCount === 1 ? "Link do kodu QR" : `Linki do kodów QR (${config.linksCount})`}
									</p>
									{state.links.map((link, index) => (
										<label key={index} className="flex flex-col gap-1.5 text-sm">
											<span className="font-medium">Link {config.linksCount > 1 ? `#${index + 1}` : ""}</span>
											<Input
												type="url"
												value={link}
												onChange={(event) =>
													setState((current) => {
														if (!current) return current;
														const links = [...current.links];
														links[index] = event.target.value;
														return { ...current, links };
													})
												}
												placeholder="https://…"
												required
											/>
										</label>
									))}
								</div>
							) : null}

							{config.uploadSettings.enabled ? (
								<div className="flex flex-col gap-2">
									<p className="text-sm font-medium text-foreground">
										{config.uploadSettings.label.trim() || "Pliki klienta"}
										{config.uploadSettings.required ? " *" : ""}
									</p>
									<FileUploadSection
										maxFiles={config.uploadSettings.count}
										label={config.uploadSettings.label.trim() || undefined}
										required={config.uploadSettings.required}
										files={uploadedForSection}
										onFilesChange={(files) =>
											setState((current) => {
												if (!current) return current;
												const slots = Array.from({ length: config.uploadSettings.count }, (_, index) => {
													const file = files[index];
													return file ? { url: file.url, filename: file.filename } : null;
												});
												return { ...current, uploadedFiles: slots };
											})
										}
									/>
								</div>
							) : null}

							<label className="flex flex-col gap-1.5 text-sm">
								<span className="font-medium">Uwagi do pozycji</span>
								<textarea
									value={state.lineNote}
									onChange={(event) =>
										setState((current) => (current ? { ...current, lineNote: event.target.value } : current))
									}
									rows={2}
									className={inputClass}
									placeholder="Personalizacja, ustalenia, doprecyzowanie…"
								/>
							</label>

							{validationError ? <p className="text-sm text-destructive">{validationError}</p> : null}
						</div>
					)}
				</div>

				<div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">
					<Button type="button" variant="outline" onClick={onClose} disabled={loading}>
						Anuluj
					</Button>
					<Button
						type="button"
						onClick={handleConfirm}
						disabled={loading || !!loadError || !config || !state}
						className={cn("gap-2")}
					>
						Dodaj do zamówienia
					</Button>
				</div>
			</div>
		</div>,
		document.body,
	);
}
