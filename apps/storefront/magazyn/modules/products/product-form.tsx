"use client";

import { ImagePlus, Loader2, Save, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { cn } from "@magazyn/core/lib/cn";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ColorCategoryId } from "./color-categories";
import type { AdminProductDetail, CategoryOption, ConfigOption } from "./store";
import { saveProductAction, uploadImagesAction } from "./actions";
import { ProductConfigSection } from "./product-config-section";
import {
	addColorSlot,
	addProductColor,
	createInitialColorSlotState,
	removeColorSlot,
	removeProductColor,
	renameColorSlot,
	serializeColorSlotState,
	type ColorSlotFormState,
} from "./product-color-config-state";

type Props = {
	product?: AdminProductDetail;
	categories: CategoryOption[];
	configOptions: ConfigOption[];
};

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ProductForm({ product, categories, configOptions }: Props) {
	const router = useRouter();
	const titleId = useId();
	const fileId = useId();

	const [title, setTitle] = useState(product?.title ?? "");
	const [status, setStatus] = useState<"draft" | "published">(product?.status ?? "draft");
	const [categoryId, setCategoryId] = useState<string>(product?.categoryId ?? "");
	const [description, setDescription] = useState(product?.description ?? "");
	const [priceMajor, setPriceMajor] = useState<string>(product?.price != null ? String(product.price / 100) : "");
	const [images, setImages] = useState<string[]>(product?.images ?? []);
	const [colorSlotState, setColorSlotState] = useState<ColorSlotFormState>(() =>
		createInitialColorSlotState(product, configOptions),
	);

	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [saving, startSave] = useTransition();

	const disabledColorIdsForActiveSlot = useMemo(
		() => colorSlotState.disabledBySlot[colorSlotState.activeSlot] ?? new Set<string>(),
		[colorSlotState.activeSlot, colorSlotState.disabledBySlot],
	);

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

	async function onUpload(files: FileList | null) {
		if (!files || files.length === 0) return;
		setUploading(true);
		setError(null);
		const formData = new FormData();
		for (const file of Array.from(files)) formData.append("files", file);
		const result = await uploadImagesAction(formData);
		setUploading(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		setImages((prev) => [...prev, ...result.urls]);
	}

	function toggleColorForActiveSlot(id: string, enabled: boolean) {
		setColorSlotState((prev) => {
			const slot = prev.activeSlot;
			const current = new Set(prev.disabledBySlot[slot] ?? []);
			if (enabled) current.delete(id);
			else current.add(id);
			return {
				...prev,
				disabledBySlot: { ...prev.disabledBySlot, [slot]: current },
			};
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

	function enableAllConfigOptions() {
		setColorSlotState((prev) => {
			const clearedSlots = Object.fromEntries(
				prev.slotTitles.map((title) => [title, new Set<string>()]),
			) as Record<string, Set<string>>;
			return {
				...prev,
				nonColorDisabledIds: new Set(),
				disabledBySlot: clearedSlots,
			};
		});
	}

	function disableAllColorsForActiveSlot() {
		setColorSlotState((prev) => {
			const slot = prev.activeSlot;
			const colorIds = configOptions.filter((o) => o.type === "color").map((o) => o.id);
			return {
				...prev,
				disabledBySlot: { ...prev.disabledBySlot, [slot]: new Set(colorIds) },
			};
		});
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
			addProductColor(prev, prev.activeSlot, category, input),
		);
	}

	function handleRemoveProductColor(category: ColorCategoryId, colorId: string) {
		setColorSlotState((prev) =>
			removeProductColor(prev, prev.activeSlot, category, colorId),
		);
	}

	function onSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError(null);
		setSaved(false);
		const priceNumber = priceMajor.trim() === "" ? null : Math.round(Number(priceMajor) * 100);
		const colorConfig = serializeColorSlotState(colorSlotState);

		startSave(async () => {
			const result = await saveProductAction({
				id: product?.id,
				handle: product?.handle,
				variantId: product?.variantId ?? null,
				priceId: product?.priceId ?? null,
				title: title.trim(),
				status,
				categoryId: categoryId || null,
				description,
				price: priceNumber,
				images,
				disabledConfigIds: colorConfig.disabledConfigIds,
				disabledConfigIdsBySlot: colorConfig.disabledConfigIdsBySlot,
				allowCustomColorBySlot: colorConfig.allowCustomColorBySlot,
				productColorsBySlot: colorConfig.productColorsBySlot,
				colorSlotCount: colorConfig.colorSlotCount,
				colorSlotNames: colorConfig.colorSlotNames,
				allowCustomColor: colorConfig.allowCustomColor,
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
					<div className="flex flex-wrap gap-3">
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
							className="grid size-24 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted"
						>
							{uploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
						</label>
						<input id={fileId} type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => onUpload(e.target.files)} />
					</div>
				</div>

				<ProductConfigSection
					configOptions={configOptions}
					slotTitles={colorSlotState.slotTitles}
					activeSlot={colorSlotState.activeSlot}
					onActiveSlotChange={(slot) => setColorSlotState((prev) => ({ ...prev, activeSlot: slot }))}
				onAddSlot={() => setColorSlotState((prev) => addColorSlot(prev))}
				onRemoveSlot={(title) => setColorSlotState((prev) => removeColorSlot(prev, title))}
				onRenameSlot={(oldTitle, newTitle) => setColorSlotState((prev) => renameColorSlot(prev, oldTitle, newTitle))}
					disabledConfigIds={colorSlotState.nonColorDisabledIds}
					disabledColorIdsForActiveSlot={disabledColorIdsForActiveSlot}
					onToggleColor={toggleColorForActiveSlot}
					onToggleNonColor={toggleNonColorOption}
					onEnableAll={enableAllConfigOptions}
					onDisableAllColorsForActiveSlot={disableAllColorsForActiveSlot}
					productColorsForActiveSlot={productColorsForActiveSlot}
					onAddProductColor={handleAddProductColor}
					onRemoveProductColor={handleRemoveProductColor}
					allowCustomColor={allowCustomForActiveSlot}
					onAllowCustomColorChange={setAllowCustomForActiveSlot}
					hasAnyDisabled={hasAnyDisabled}
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

				<div className="flex flex-col gap-1.5">
					<label htmlFor="product-category" className="text-sm font-medium">Kategoria</label>
					<select id="product-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
						<option value="">— brak —</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>{c.name}</option>
						))}
					</select>
				</div>

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
