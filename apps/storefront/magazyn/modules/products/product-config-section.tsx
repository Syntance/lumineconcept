"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { cn } from "@magazyn/core/lib/cn";
import { CheckboxInput } from "@magazyn/core/ui/checkbox";
import { Button } from "@magazyn/core/ui/button";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ProductCustomColor } from "@/lib/products/color-slot-config";
import { Switch } from "@magazyn/core/ui/switch";
import type { ColorCategoryDefinition, ColorCategoryId } from "./color-categories";
import { AddProductColorForm } from "./add-product-color-form";
import { ColorSlotPicker } from "./color-slot-picker";
import { ColorSwatch, colorsInCategory } from "./color-ui";
import type { ConfigOption } from "./store";

const TYPE_LABELS: Record<string, string> = {
	size: "Wersje — rozmiary",
	material: "Wersje — materiały",
	led: "Wersje — LED",
	finish: "Wersje — wykończenia",
};

const NON_COLOR_TYPES = ["size", "material", "led", "finish"] as const;
const GLOBAL_COLORS_PATH = `${magazynConfig.basePath}/panel/ustawienia/kolory`;

type Props = {
	configOptions: ConfigOption[];
	colorCategories: ColorCategoryDefinition[];
	slotTitles: string[];
	activeSlot: string;
	onActiveSlotChange: (slot: string) => void;
	onAddSlot: () => void;
	onRemoveSlot: (slotTitle: string) => void;
	onRenameSlot?: (oldTitle: string, newTitle: string) => void;
	disabledConfigIds: Set<string>;
	disabledColorIdsForActiveSlot: Set<string>;
	disabledCategoryIdsForActiveSlot: Set<string>;
	productColorsForActiveSlot: Record<string, ProductCustomColor[]>;
	onToggleColor: (id: string, enabled: boolean) => void;
	onToggleNonColor: (id: string, enabled: boolean) => void;
	onEnableAllColorsForActiveSlot: () => void;
	onDisableAllColorsForActiveSlot: () => void;
	onToggleCategory: (categoryId: ColorCategoryId, enabled: boolean) => void;
	onAddProductColor: (category: ColorCategoryId, input: { name: string; hex_color: string }) => void;
	onRemoveProductColor: (category: ColorCategoryId, colorId: string) => void;
	getGlobalColorMatAllowed: (colorId: string, globalDefault: boolean) => boolean;
	onToggleGlobalColorMat: (colorId: string, globalDefault: boolean, enabled: boolean) => void;
	onToggleProductColorMat: (category: ColorCategoryId, colorId: string, enabled: boolean) => void;
	allowCustomColor: boolean;
	onAllowCustomColorChange: (enabled: boolean) => void;
	hasAnyDisabled: boolean;
	embedded?: boolean;
	standAvailable?: boolean;
	productColorMode?: "no_stand" | "with_stand";
	onProductColorModeChange?: (mode: "no_stand" | "with_stand") => void;
};

export function ProductConfigSection({
	configOptions,
	colorCategories,
	slotTitles,
	activeSlot,
	onActiveSlotChange,
	onAddSlot,
	onRemoveSlot,
	onRenameSlot,
	disabledConfigIds,
	disabledColorIdsForActiveSlot,
	disabledCategoryIdsForActiveSlot,
	productColorsForActiveSlot,
	onToggleColor,
	onToggleNonColor,
	onEnableAllColorsForActiveSlot,
	onDisableAllColorsForActiveSlot,
	onToggleCategory,
	onAddProductColor,
	onRemoveProductColor,
	getGlobalColorMatAllowed,
	onToggleGlobalColorMat,
	onToggleProductColorMat,
	allowCustomColor,
	onAllowCustomColorChange,
	embedded = false,
	standAvailable = false,
	productColorMode = "no_stand",
	onProductColorModeChange,
}: Props) {
	const colorOptions = configOptions.filter((o) => o.type === "color");
	const allColorsDisabledForSlot =
		colorOptions.length > 0 &&
		colorOptions.every((o) => disabledColorIdsForActiveSlot.has(o.id));

	const groupedNonColor = NON_COLOR_TYPES.reduce<Record<string, ConfigOption[]>>((acc, type) => {
		const opts = configOptions.filter((o) => o.type === type);
		if (opts.length > 0) acc[type] = opts;
		return acc;
	}, {});

	return (
		<div
			className={cn(
				"flex flex-col gap-5",
				!embedded && "rounded-xl border border-border bg-card p-5",
			)}
		>
			<div>
				<h2 className="text-sm font-medium text-foreground">Kolory i wersje produktu</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Wybierz pole koloru i ustaw dostępne opcje tylko dla niego. Globalną paletę edytujesz w{" "}
					<Link
						href={GLOBAL_COLORS_PATH}
						className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						ustawieniach sklepu
					</Link>
					.
				</p>
			</div>

			{standAvailable && onProductColorModeChange ? (
				<div
					role="group"
					aria-label="Tryb konfiguracji kolorów produktu"
					className="flex rounded-lg border border-border p-1"
				>
					<button
						type="button"
						onClick={() => onProductColorModeChange("no_stand")}
						className={cn(
							"flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
							productColorMode === "no_stand"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Bez podstawki
					</button>
					<button
						type="button"
						onClick={() => onProductColorModeChange("with_stand")}
						className={cn(
							"flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
							productColorMode === "with_stand"
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Z podstawką
					</button>
				</div>
			) : null}

			<ColorSlotPicker
				slotTitles={slotTitles}
				activeSlot={activeSlot}
				onActiveSlotChange={onActiveSlotChange}
				onAddSlot={onAddSlot}
				onRemoveSlot={onRemoveSlot}
				onRenameSlot={onRenameSlot}
			/>

			{colorOptions.length > 0 ? (
				<div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={
							allColorsDisabledForSlot
								? onEnableAllColorsForActiveSlot
								: onDisableAllColorsForActiveSlot
						}
						className="h-8"
					>
						{allColorsDisabledForSlot ? "Włącz wszystkie kolory" : "Wyłącz wszystkie kolory"}
					</Button>
				</div>
			) : null}

			<div className="flex flex-col gap-5">
				{colorCategories.map((section) => {
					const globalOpts = colorsInCategory(configOptions, section.id);
					const productOpts = productColorsForActiveSlot[section.id] ?? [];
					const categoryEnabled = !disabledCategoryIdsForActiveSlot.has(section.id);

					return (
						<div
							key={section.id}
							className={cn(
								"rounded-lg border border-border/70 p-4 transition-opacity",
								!categoryEnabled && "opacity-60",
							)}
						>
							<div className="flex items-center justify-between gap-3">
								<h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									{section.label}
								</h3>
								<div className="flex items-center gap-2">
									<span className="text-[11px] text-muted-foreground">
										{categoryEnabled ? "Włączona" : "Wyłączona"}
									</span>
									<Switch
										checked={categoryEnabled}
										onCheckedChange={(enabled) => onToggleCategory(section.id, enabled)}
										aria-label={`${categoryEnabled ? "Wyłącz" : "Włącz"} kategorię ${section.label} dla ${activeSlot}`}
									/>
								</div>
							</div>

							{!categoryEnabled ? (
								<p className="mt-2 text-xs text-muted-foreground">
									Kategoria ukryta w konfiguratorze dla pola „{activeSlot}”.
								</p>
							) : null}

							{categoryEnabled && globalOpts.length > 0 ? (
								<div className="mt-2">
									<p className="mb-1.5 text-[11px] text-muted-foreground">Z globalnej palety</p>
									<div className="flex flex-col gap-2">
										{globalOpts.map((opt) => {
											const enabled = !disabledColorIdsForActiveSlot.has(opt.id);
											const matAllowed = getGlobalColorMatAllowed(opt.id, opt.mat_allowed);
											return (
												<div
													key={opt.id}
													className={cn(
														"flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
														enabled
															? "border-border bg-background text-foreground"
															: "border-border/60 bg-muted/40 text-muted-foreground",
													)}
												>
													<label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
														<CheckboxInput
															checked={enabled}
															onChange={(checked) => onToggleColor(opt.id, checked)}
															aria-label={`${opt.name} — ${enabled ? "włączony" : "wyłączony"} dla ${activeSlot}`}
														/>
														<ColorSwatch hex={opt.hex_color} />
														<span>{opt.name}</span>
													</label>
													<div className="flex shrink-0 items-center gap-2">
														<span className="text-[11px] text-muted-foreground">Mat</span>
														<Switch
															checked={matAllowed}
															disabled={!enabled}
															onCheckedChange={(checked) =>
																onToggleGlobalColorMat(opt.id, opt.mat_allowed, checked)
															}
															aria-label={`${matAllowed ? "Wyłącz" : "Włącz"} mat dla koloru ${opt.name} w polu ${activeSlot}`}
														/>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							) : null}

							{categoryEnabled && productOpts.length > 0 ? (
								<ul className="mt-3 flex flex-col gap-2">
									<p className="text-[11px] text-muted-foreground">Tylko ten produkt</p>
									{productOpts.map((opt) => (
										<li
											key={opt.id}
											className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<div className="flex min-w-0 items-center gap-2 text-sm">
													<ColorSwatch hex={opt.hex_color} />
													<span className="font-medium">{opt.name}</span>
													<span className="font-mono text-xs text-muted-foreground">
														{opt.hex_color}
													</span>
												</div>
												<div className="flex shrink-0 items-center gap-2 border-l border-border pl-3">
													<span className="text-[11px] text-muted-foreground">Mat</span>
													<Switch
														checked={opt.mat_allowed}
														onCheckedChange={(checked) =>
															onToggleProductColorMat(section.id, opt.id, checked)
														}
														aria-label={`${opt.mat_allowed ? "Wyłącz" : "Włącz"} mat dla koloru ${opt.name}`}
													/>
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => onRemoveProductColor(section.id, opt.id)}
												className="h-8 gap-1 text-destructive hover:text-destructive"
												aria-label={`Usuń kolor ${opt.name}`}
											>
												<Trash2 className="size-3.5" aria-hidden />
												Usuń
											</Button>
										</li>
									))}
								</ul>
							) : null}

							{categoryEnabled && globalOpts.length === 0 && productOpts.length === 0 ? (
								<p className="mt-2 text-xs text-muted-foreground">Brak kolorów w tej kategorii.</p>
							) : null}

							{categoryEnabled ? (
								<AddProductColorForm
									category={section.id}
									slotLabel={activeSlot}
									onAdd={(input) => onAddProductColor(section.id, input)}
								/>
							) : null}

							{categoryEnabled && section.id === "custom" ? (
								<label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
									<CheckboxInput
										checked={allowCustomColor}
										onChange={onAllowCustomColorChange}
										aria-label={`Własny kolor HEX od klienta dla ${activeSlot}`}
									/>
									<span>Własny kolor HEX od klienta (wpisywany w konfiguratorze)</span>
								</label>
							) : null}
						</div>
					);
				})}
			</div>

			{Object.entries(groupedNonColor).map(([type, opts]) => (
				<div key={type}>
					<h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{TYPE_LABELS[type] ?? type}
					</h3>
					<p className="mb-2 text-xs text-muted-foreground">Wspólne dla całego produktu (niezależnie od pola koloru).</p>
					<div className="flex flex-wrap gap-2">
						{opts.map((opt) => {
							const enabled = !disabledConfigIds.has(opt.id);
							return (
								<label
									key={opt.id}
									className={cn(
										"flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
										enabled
											? "border-border bg-background text-foreground"
											: "border-border/60 bg-muted/40 text-muted-foreground",
									)}
								>
									<CheckboxInput
										checked={enabled}
										onChange={(checked) => onToggleNonColor(opt.id, checked)}
										aria-label={`${opt.name} — ${enabled ? "włączony" : "wyłączony"}`}
									/>
									<span>{opt.name}</span>
								</label>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}
