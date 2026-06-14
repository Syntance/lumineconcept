"use client";

import { ImagePlus, Loader2, Save, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useId, useMemo, useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { cn } from "@magazyn/core/lib/cn";
import { isImageFile, useFileDropZone } from "@magazyn/core/hooks/use-file-drop-zone";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ColorCategoryDefinition, ColorCategoryId } from "./color-categories";
import type { AdminProductDetail, CategoryOption, ConfigOption } from "./store";
import { saveProductAction, uploadImagesAction } from "./actions";
import { ProductConfigSection } from "./product-config-section";
import {
	addColorSlot,
	addProductColor,
	createInitialColorSlotState,
	getActiveDisabledBySlot,
	getActiveDisabledCategoriesBySlot,
	removeColorSlot,
	removeProductColor,
	renameColorSlot,
	serializeColorSlotState,
	getGlobalColorMatAllowed,
	toggleGlobalColorMat,
	toggleProductColorMat,
	type ColorSlotFormState,
} from "./product-color-config-state";
import { StandConfigSection } from "./stand-config-section";
import { emptyProductColorsByCategory } from "@/lib/products/color-slot-config";
import {
	addTextField,
	createInitialTextFieldState,
	removeTextField,
	renameTextFieldLabel,
	serializeTextFieldState,
	updateTextField,
	type TextFieldFormState,
} from "./product-text-field-state";
import { TextFieldsSection } from "./text-fields-section";
import { ProductUploadSettingsSection } from "./product-upload-settings-section";
import { ProductFormTabs } from "./product-form-tabs";
import { ProductSeoPanel } from "./product-seo-panel";
import type { ProductUploadSettings } from "@/lib/products/upload-settings";
import type { ProductFaqItem, ProductSeoMeta } from "@/lib/content/types";

type Props = {
	product?: AdminProductDetail;
	categories: CategoryOption[];
	configOptions: ConfigOption[];
	colorCategories: ColorCategoryDefinition[];
};

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ProductForm({ product, categories, configOptions, colorCategories }: Props) {
	const router = useRouter();
	const titleId = useId();
	const fileId = useId();

	const [title, setTitle] = useState(product?.title ?? "");
	const [status, setStatus] = useState<"draft" | "published">(product?.status ?? "draft");
	const [categoryIds, setCategoryIds] = useState<string[]>(() => product?.categoryIds ?? []);
	const [description, setDescription] = useState(product?.description ?? "");
	const [priceMajor, setPriceMajor] = useState<string>(product?.price != null ? String(product.price / 100) : "");
	const [images, setImages] = useState<string[]>(product?.images ?? []);
	const [colorSlotState, setColorSlotState] = useState<ColorSlotFormState>(() =>
		createInitialColorSlotState(product, configOptions, colorCategories),
	);
	const [textFieldState, setTextFieldState] = useState<TextFieldFormState>(() =>
		createInitialTextFieldState(product),
	);
	const [uploadSettings, setUploadSettings] = useState<ProductUploadSettings>(
		() =>
			product?.uploadSettings ?? { enabled: false, required: false, count: 1, label: "" },
	);
	const [seo, setSeo] = useState<ProductSeoMeta>(() => product?.seo ?? {});
	const [productFaq, setProductFaq] = useState<ProductFaqItem[]>(() => product?.productFaq ?? []);

	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [saving, startSave] = useTransition();

	const disabledColorIdsForActiveSlot = useMemo(() => {
		const active = getActiveDisabledBySlot(colorSlotState);
		return active[colorSlotState.activeSlot] ?? new Set<string>();
	}, [colorSlotState]);

	const disabledCategoryIdsForActiveSlot = useMemo(() => {
		const active = getActiveDisabledCategoriesBySlot(colorSlotState);
		return active[colorSlotState.activeSlot] ?? new Set<string>();
	}, [colorSlotState]);

	const allowCustomForActiveSlot =
		colorSlotState.allowCustomBySlot[colorSlotState.activeSlot] ?? true;

	const productColorsForActiveSlot =
		colorSlotState.productColorsBySlot[colorSlotState.activeSlot] ?? {
			standard: [],
			color: [],
			mirror: [],
			custom: [],
		};

	const hasAnyDisabled = useMemo(() => {
		if (colorSlotState.nonColorDisabledIds.size > 0) return true;
		return colorSlotState.slotTitles.some(
			(title) => (colorSlotState.disabledBySlot[title]?.size ?? 0) > 0,
		);
	}, [colorSlotState]);

	const uploadFiles = useCallback(
		async (files: File[]) => {
			if (files.length === 0) return;
			setUploading(true);
			setError(null);
			try {
				const formData = new FormData();
				for (const file of files) formData.append("files", file);
				const result = await uploadImagesAction(formData);
				if (result.error) {
					setError(result.error);
					return;
				}
				setImages((prev) => [...prev, ...result.urls]);
			} catch {
				setError("Upload nie powiódł się. Spróbuj ponownie.");
			} finally {
				setUploading(false);
			}
		},
		[],
	);

	const { isDragging, dropZoneProps } = useFileDropZone({
		disabled: uploading,
		accept: isImageFile,
		onDropFiles: (files) => {
			void uploadFiles(files);
		},
	});

	function updateActiveSlotDisabled(updater: (current: Set<string>) => Set<string>) {
		setColorSlotState((prev) => {
			const slot = prev.activeSlot;
			const isWithStand = prev.productColorMode === "with_stand";
			const key = isWithStand ? "disabledBySlotWithStand" : "disabledBySlot";
			const current = new Set(prev[key][slot] ?? []);
			return {
				...prev,
				[key]: { ...prev[key], [slot]: updater(current) },
			};
		});
	}

	function toggleColorForActiveSlot(id: string, enabled: boolean) {
		updateActiveSlotDisabled((current) => {
			if (enabled) current.delete(id);
			else current.add(id);
			return current;
		});
	}

	function toggleNonColorOption(id: string, enabled: boolean) {
		setColorSlotState((prev) => {
			const next = new Set(prev.nonColorDisabledIds);
			if (enabled) next.delete(id);
			else next.add(id);
			return { ...prev, nonColorDisabledIds: next };
		});
	}

	function enableAllColorsForActiveSlot() {
		updateActiveSlotDisabled(() => new Set<string>());
	}

	function disableAllColorsForActiveSlot() {
		const colorIds = configOptions.filter((o) => o.type === "color").map((o) => o.id);
		updateActiveSlotDisabled(() => new Set(colorIds));
	}

	function setAllowCustomForActiveSlot(enabled: boolean) {
		setColorSlotState((prev) => ({
			...prev,
			allowCustomBySlot: { ...prev.allowCustomBySlot, [prev.activeSlot]: enabled },
		}));
	}

	function handleAddProductColor(
		category: ColorCategoryId,
		input: { name: string; hex_color: string },
	) {
		setColorSlotState((prev) =>
			addProductColor(prev, prev.activeSlot, category, input, colorCategories),
		);
	}

	function toggleCategoryForActiveSlot(categoryId: ColorCategoryId, enabled: boolean) {
		setColorSlotState((prev) => {
			const isWithStand = prev.productColorMode === "with_stand";
			const categoriesKey = isWithStand
				? "disabledCategoriesBySlotWithStand"
				: "disabledCategoriesBySlot";
			const slot = prev.activeSlot;
			const current = new Set(prev[categoriesKey][slot] ?? []);
			if (enabled) current.delete(categoryId);
			else current.add(categoryId);
			const nextAllowCustomBySlot = { ...prev.allowCustomBySlot };
			if (!enabled && categoryId === "custom") {
				nextAllowCustomBySlot[slot] = false;
			}
			return {
				...prev,
				[categoriesKey]: { ...prev[categoriesKey], [slot]: current },
				allowCustomBySlot: nextAllowCustomBySlot,
			};
		});
	}

	function handleRemoveProductColor(category: ColorCategoryId, colorId: string) {
		setColorSlotState((prev) =>
			removeProductColor(prev, prev.activeSlot, category, colorId),
		);
	}

	function resolveGlobalColorMatAllowed(colorId: string, globalDefault: boolean) {
		return getGlobalColorMatAllowed(colorSlotState, colorSlotState.activeSlot, colorId, globalDefault);
	}

	function handleToggleGlobalColorMat(colorId: string, globalDefault: boolean, enabled: boolean) {
		setColorSlotState((prev) =>
			toggleGlobalColorMat(prev, prev.activeSlot, colorId, globalDefault, enabled),
		);
	}

	function handleToggleProductColorMat(
		category: ColorCategoryId,
		colorId: string,
		enabled: boolean,
	) {
		setColorSlotState((prev) =>
			toggleProductColorMat(prev, prev.activeSlot, category, colorId, enabled),
		);
	}

	function toggleStandColor(id: string, enabled: boolean) {
		setColorSlotState((prev) => {
			const current = new Set(prev.standDisabledColorIds);
			if (enabled) current.delete(id);
			else current.add(id);
			return { ...prev, standDisabledColorIds: current };
		});
	}

	function toggleStandCategory(categoryId: ColorCategoryId, enabled: boolean) {
		setColorSlotState((prev) => {
			const current = new Set(prev.standDisabledCategories);
			if (enabled) current.delete(categoryId);
			else current.add(categoryId);
			return {
				...prev,
				standDisabledCategories: current,
				standAllowCustomColor: enabled || categoryId !== "custom" ? prev.standAllowCustomColor : false,
			};
		});
	}

	function handleAddStandProductColor(
		category: ColorCategoryId,
		input: { name: string; hex_color: string },
	) {
		setColorSlotState((prev) => {
			const section = colorCategories.find((c) => c.id === category);
			const slotColors = prev.standProductColors;
			const color = {
				id: `sc_${crypto.randomUUID()}`,
				name: input.name.trim(),
				hex_color: input.hex_color,
				color_category: category,
				mat_allowed: section?.matDefault ?? true,
			};
			return {
				...prev,
				standProductColors: {
					...slotColors,
					[category]: [...(slotColors[category] ?? []), color],
				},
			};
		});
	}

	function handleRemoveStandProductColor(category: ColorCategoryId, colorId: string) {
		setColorSlotState((prev) => ({
			...prev,
			standProductColors: {
				...prev.standProductColors,
				[category]: (prev.standProductColors[category] ?? []).filter((c) => c.id !== colorId),
			},
		}));
	}

	function resolveStandGlobalColorMatAllowed(colorId: string, globalDefault: boolean) {
		return colorSlotState.standMatOverrides[colorId] ?? globalDefault;
	}

	function handleToggleStandGlobalColorMat(
		colorId: string,
		globalDefault: boolean,
		enabled: boolean,
	) {
		setColorSlotState((prev) => {
			const current = { ...prev.standMatOverrides };
			if (enabled === globalDefault) delete current[colorId];
			else current[colorId] = enabled;
			return { ...prev, standMatOverrides: current };
		});
	}

	function handleToggleStandProductColorMat(
		category: ColorCategoryId,
		colorId: string,
		enabled: boolean,
	) {
		setColorSlotState((prev) => ({
			...prev,
			standProductColors: {
				...prev.standProductColors,
				[category]: (prev.standProductColors[category] ?? []).map((color) =>
					color.id === colorId ? { ...color, mat_allowed: enabled } : color,
				),
			},
		}));
	}

	function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		setSaved(false);
		const priceNumber = priceMajor.trim() === "" ? null : Math.round(Number(priceMajor) * 100);
		const colorConfig = serializeColorSlotState(colorSlotState);
		const textFields = serializeTextFieldState(textFieldState);

		startSave(async () => {
			const result = await saveProductAction({
				id: product?.id,
				handle: product?.handle,
				variantId: product?.variantId ?? null,
				priceId: product?.priceId ?? null,
				title: title.trim(),
				status,
				categoryIds,
				description,
				price: priceNumber,
				images,
				disabledConfigIds: colorConfig.disabledConfigIds,
				disabledConfigIdsBySlot: colorConfig.disabledConfigIdsBySlot,
				disabledColorCategoriesBySlot: colorConfig.disabledColorCategoriesBySlot,
				allowCustomColorBySlot: colorConfig.allowCustomColorBySlot,
				productColorsBySlot: colorConfig.productColorsBySlot,
				matOverridesBySlot: colorConfig.matOverridesBySlot,
				matOverridesBySlotWithStand: colorConfig.matOverridesBySlotWithStand,
				colorSlotCount: colorConfig.colorSlotCount,
				colorSlotNames: colorConfig.colorSlotNames,
				allowCustomColor: colorConfig.allowCustomColor,
				disabledConfigIdsBySlotWithStand: colorConfig.disabledConfigIdsBySlotWithStand,
				disabledColorCategoriesBySlotWithStand: colorConfig.disabledColorCategoriesBySlotWithStand,
				standAvailable: colorConfig.standAvailable,
				standPaid: colorConfig.standPaid,
				standSurchargeGrosze: colorConfig.standSurchargeGrosze,
				standDisabledConfigIds: colorConfig.standDisabledConfigIds,
				standDisabledColorCategories: colorConfig.standDisabledColorCategories,
				standProductColors: colorConfig.standProductColors,
				standAllowCustomColor: colorConfig.standAllowCustomColor,
				standMatOverrides: colorConfig.standMatOverrides,
				textFields,
				uploadsEnabled: uploadSettings.enabled,
				uploadsRequired: uploadSettings.required,
				uploadsCount: uploadSettings.count,
				uploadsLabel: uploadSettings.label,
				seo,
				productFaq: productFaq.filter((f) => f.question.trim() && f.answer.trim()),
			});
			if (result && !result.ok) {
				setError(result.error);
				return;
			}
			if (product?.id) {
				setSaved(true);
				router.refresh();
			}
		});
	}

	return (
		<form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
			<div className="flex flex-col gap-5">
				<div className="flex flex-col gap-1.5">
					<label htmlFor={titleId} className="text-sm font-medium">Nazwa</label>
					<Input id={titleId} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="np. Lampa stołowa" required className="h-10" />
				</div>

				<div className="flex flex-col gap-1.5">
					<span className="text-sm font-medium">Opis</span>
					<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className={inputClass} />
				</div>

				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium">Zdjęcia</span>
					<div
						{...dropZoneProps}
						className={cn(
							"flex flex-wrap gap-3 rounded-lg p-2 transition-colors",
							isDragging && "bg-primary/5 ring-2 ring-primary ring-offset-2",
						)}
					>
						{images.map((url) => (
							<div key={url} className="relative size-24 overflow-hidden rounded-lg border border-border bg-muted">
								<Image src={url} alt="" fill sizes="96px" className="object-cover" />
								<button
									type="button"
									aria-label="Usuń zdjęcie"
									onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
									className="absolute right-1 top-1 grid size-6 place-items-center rounded-md bg-background/80 text-muted-foreground hover:text-destructive"
								>
									<X className="size-3.5" aria-hidden />
								</button>
							</div>
						))}
						<label
							htmlFor={fileId}
							className={cn(
								"grid size-24 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted",
								isDragging && "border-primary bg-primary/5",
								uploading && "pointer-events-none opacity-60",
							)}
						>
							{uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
						</label>
						<input
							id={fileId}
							type="file"
							accept="image/*"
							multiple
							className="sr-only"
							disabled={uploading}
							onChange={(e) => {
								void uploadFiles(Array.from(e.target.files ?? []));
								e.target.value = "";
							}}
						/>
					</div>
					<p className="text-xs text-muted-foreground">Przeciągnij zdjęcia na pole lub kliknij, aby wybrać pliki.</p>
				</div>

				<ProductFormTabs
					fieldsCount={textFieldState.fields.length}
					showStandTab={colorSlotState.standAvailable}
					colorsPanel={
						<ProductConfigSection
							embedded
							configOptions={configOptions}
							colorCategories={colorCategories}
							slotTitles={colorSlotState.slotTitles}
							activeSlot={colorSlotState.activeSlot}
							onActiveSlotChange={(slot) =>
								setColorSlotState((prev) => ({ ...prev, activeSlot: slot }))
							}
							onAddSlot={() => setColorSlotState((prev) => addColorSlot(prev))}
							onRemoveSlot={(title) =>
								setColorSlotState((prev) => removeColorSlot(prev, title))
							}
							onRenameSlot={(oldTitle, newTitle) =>
								setColorSlotState((prev) => renameColorSlot(prev, oldTitle, newTitle))
							}
							disabledConfigIds={colorSlotState.nonColorDisabledIds}
							disabledColorIdsForActiveSlot={disabledColorIdsForActiveSlot}
							disabledCategoryIdsForActiveSlot={disabledCategoryIdsForActiveSlot}
							onToggleColor={toggleColorForActiveSlot}
							onToggleCategory={toggleCategoryForActiveSlot}
							onToggleNonColor={toggleNonColorOption}
							onEnableAllColorsForActiveSlot={enableAllColorsForActiveSlot}
							onDisableAllColorsForActiveSlot={disableAllColorsForActiveSlot}
							productColorsForActiveSlot={productColorsForActiveSlot}
							onAddProductColor={handleAddProductColor}
							onRemoveProductColor={handleRemoveProductColor}
							getGlobalColorMatAllowed={resolveGlobalColorMatAllowed}
							onToggleGlobalColorMat={handleToggleGlobalColorMat}
							onToggleProductColorMat={handleToggleProductColorMat}
							allowCustomColor={allowCustomForActiveSlot}
							onAllowCustomColorChange={setAllowCustomForActiveSlot}
							hasAnyDisabled={hasAnyDisabled}
							standAvailable={colorSlotState.standAvailable}
							productColorMode={colorSlotState.productColorMode}
							onProductColorModeChange={(mode) =>
								setColorSlotState((prev) => ({ ...prev, productColorMode: mode }))
							}
						/>
					}
					standPanel={
						<StandConfigSection
							configOptions={configOptions}
							colorCategories={colorCategories}
							disabledColorIds={colorSlotState.standDisabledColorIds}
							disabledCategoryIds={colorSlotState.standDisabledCategories}
							productColors={colorSlotState.standProductColors}
							allowCustomColor={colorSlotState.standAllowCustomColor}
							onToggleColor={toggleStandColor}
							onToggleCategory={toggleStandCategory}
							onAddProductColor={handleAddStandProductColor}
							onRemoveProductColor={handleRemoveStandProductColor}
							getGlobalColorMatAllowed={resolveStandGlobalColorMatAllowed}
							onToggleGlobalColorMat={handleToggleStandGlobalColorMat}
							onToggleProductColorMat={handleToggleStandProductColorMat}
							onAllowCustomColorChange={(enabled) =>
								setColorSlotState((prev) => ({ ...prev, standAllowCustomColor: enabled }))
							}
							onEnableAllColors={() => {
								setColorSlotState((prev) => ({ ...prev, standDisabledColorIds: new Set() }));
							}}
							onDisableAllColors={() => {
								const colorIds = configOptions
									.filter((o) => o.type === "color")
									.map((o) => o.id);
								setColorSlotState((prev) => ({
									...prev,
									standDisabledColorIds: new Set(colorIds),
								}));
							}}
							standPaid={colorSlotState.standPaid}
							standSurchargeGrosze={colorSlotState.standSurchargeGrosze}
						/>
					}
					fieldsPanel={
						<div className="flex flex-col gap-0">
							<TextFieldsSection
								embedded
								fields={textFieldState.fields}
								activeFieldKey={textFieldState.activeFieldKey}
								onActiveFieldChange={(key) =>
									setTextFieldState((prev) => ({ ...prev, activeFieldKey: key }))
								}
								onAddField={() => setTextFieldState((prev) => addTextField(prev))}
								onRemoveField={(key) =>
									setTextFieldState((prev) => removeTextField(prev, key))
								}
								onRenameField={(key, label) =>
									setTextFieldState((prev) => renameTextFieldLabel(prev, key, label))
								}
								onUpdateField={(key, patch) =>
									setTextFieldState((prev) => updateTextField(prev, key, patch))
								}
							/>
							<ProductUploadSettingsSection
								embedded
								enabled={uploadSettings.enabled}
								required={uploadSettings.required}
								count={uploadSettings.count}
								label={uploadSettings.label}
								onEnabledChange={(enabled) =>
									setUploadSettings((prev) => ({
										...prev,
										enabled,
										count: enabled && prev.count < 1 ? 1 : prev.count,
										/** Nowe pole uploadu domyślnie opcjonalne — wymaganie włącza osobny przełącznik. */
										...(enabled && !prev.enabled ? { required: false } : {}),
									}))
								}
								onRequiredChange={(required) =>
									setUploadSettings((prev) => ({ ...prev, required }))
								}
								onCountChange={(count) =>
									setUploadSettings((prev) => ({ ...prev, count }))
								}
								onLabelChange={(label) =>
									setUploadSettings((prev) => ({ ...prev, label }))
								}
							/>
						</div>
					}
					seoPanel={
						<ProductSeoPanel
							seo={seo}
							productFaq={productFaq}
							onSeoChange={setSeo}
							onFaqChange={setProductFaq}
						/>
					}
				/>
			</div>

			<aside className="flex h-fit flex-col gap-5 rounded-xl border border-border bg-card p-5">
				<div className="flex flex-col gap-1.5">
					<label htmlFor="product-status" className="text-sm font-medium">Status</label>
					<select id="product-status" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
						<option value="draft">Szkic</option>
						<option value="published">Opublikowany</option>
					</select>
				</div>

				<fieldset className="flex flex-col gap-2">
					<legend className="text-sm font-medium">Kategorie</legend>
					<p className="text-xs text-muted-foreground">Produkt może być widoczny w wielu kategoriach sklepu.</p>
					<div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-input p-3">
						{categories.length === 0 ? (
							<p className="text-sm text-muted-foreground">Brak kategorii w sklepie.</p>
						) : (
							categories.map((c) => {
								const checked = categoryIds.includes(c.id);
								return (
									<label
										key={c.id}
										className="flex cursor-pointer items-center gap-2 text-sm"
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={() => {
												setCategoryIds((prev) =>
													checked ? prev.filter((id) => id !== c.id) : [...prev, c.id],
												);
											}}
											className="size-4 rounded border-input accent-primary"
										/>
										<span>{c.name}</span>
									</label>
								);
							})
						)}
					</div>
				</fieldset>

				<label className="flex cursor-pointer items-start gap-3 rounded-lg border border-input px-3 py-3 text-sm">
					<input
						type="checkbox"
						checked={colorSlotState.standAvailable}
						onChange={(e) =>
							setColorSlotState((prev) => ({
								...prev,
								standAvailable: e.target.checked,
								standPaid: e.target.checked ? prev.standPaid : false,
								standSurchargeGrosze: e.target.checked ? prev.standSurchargeGrosze : 0,
								standProductColors:
									Object.keys(prev.standProductColors).length > 0
										? prev.standProductColors
										: emptyProductColorsByCategory(
												colorCategories.map((c) => c.id),
											),
							}))
						}
						className="mt-0.5 size-4 rounded border-input accent-primary"
					/>
					<span>
						<span className="font-medium">Opcja podstawki</span>
						<span className="mt-0.5 block text-xs text-muted-foreground">
							Klient może dodać podstawkę i wybrać jej kolor. Domyślnie gratis.
						</span>
					</span>
				</label>

				{colorSlotState.standAvailable ? (
					<div className="flex flex-col gap-3 rounded-lg border border-input px-3 py-3 text-sm">
						<label className="flex cursor-pointer items-start gap-3">
							<input
								type="checkbox"
								checked={colorSlotState.standPaid}
								onChange={(e) =>
									setColorSlotState((prev) => ({
										...prev,
										standPaid: e.target.checked,
										standSurchargeGrosze: e.target.checked ? prev.standSurchargeGrosze : 0,
									}))
								}
								className="mt-0.5 size-4 rounded border-input accent-primary"
							/>
							<span>
								<span className="font-medium">Podstawka płatna</span>
								<span className="mt-0.5 block text-xs text-muted-foreground">
									Odznaczone = gratis dla klienta.
								</span>
							</span>
						</label>
						{colorSlotState.standPaid ? (
							<div className="flex flex-col gap-1.5 pl-7">
								<label htmlFor="stand-surcharge-price" className="text-sm font-medium">
									Dopłata za podstawkę ({magazynConfig.currency.toUpperCase()} / szt.)
								</label>
								<Input
									id="stand-surcharge-price"
									type="number"
									min={0.01}
									step="0.01"
									value={
										colorSlotState.standSurchargeGrosze > 0
											? (colorSlotState.standSurchargeGrosze / 100).toFixed(2)
											: ""
									}
									onChange={(e) => {
										const raw = e.target.value.trim();
										const grosze =
											raw === "" ? 0 : Math.max(0, Math.round(Number(raw) * 100));
										setColorSlotState((prev) => ({ ...prev, standSurchargeGrosze: grosze }));
									}}
									placeholder="np. 10,00"
									className="h-10"
									required={colorSlotState.standPaid}
								/>
							</div>
						) : null}
					</div>
				) : null}

				<div className="flex flex-col gap-1.5">
					<label htmlFor="product-price" className="text-sm font-medium">Cena ({magazynConfig.currency.toUpperCase()})</label>
					<Input id="product-price" type="number" min={0} step="0.01" value={priceMajor} onChange={(e) => setPriceMajor(e.target.value)} placeholder="0.00" className="h-10" required />
				</div>

				{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
				{saved ? <p role="status" className="text-sm text-emerald-600">Zapisano.</p> : null}

				<div className="flex flex-col gap-2">
					<Button type="submit" size="lg" disabled={saving || uploading} className="h-10 gap-1.5">
						{saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
						{saving ? "Zapisywanie…" : "Zapisz produkt"}
					</Button>
					<Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => router.push(`${magazynConfig.basePath}/panel/produkty`)} className={cn("gap-1.5")}>
						Anuluj
					</Button>
				</div>
			</aside>
		</form>
	);
}
