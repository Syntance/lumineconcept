"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { cn } from "@magazyn/core/lib/cn";
import { CheckboxInput } from "@magazyn/core/ui/checkbox";
import { Button } from "@magazyn/core/ui/button";
import { Switch } from "@magazyn/core/ui/switch";
import { magazynConfig } from "@magazyn/magazyn.config";
import type { ProductCustomColor } from "@/lib/products/color-slot-config";
import type { ColorCategoryDefinition, ColorCategoryId } from "./color-categories";
import { AddProductColorForm } from "./add-product-color-form";
import { ColorSwatch, colorsInCategory } from "./color-ui";
import type { ConfigOption } from "./store";
import { STAND_SURCHARGE_PLN } from "@/lib/products/stand-config";

const GLOBAL_COLORS_PATH = `${magazynConfig.basePath}/panel/ustawienia/kolory`;

type Props = {
	configOptions: ConfigOption[];
	colorCategories: ColorCategoryDefinition[];
	disabledColorIds: Set<string>;
	disabledCategoryIds: Set<string>;
	productColors: Record<string, ProductCustomColor[]>;
	allowCustomColor: boolean;
	onToggleColor: (id: string, enabled: boolean) => void;
	onToggleCategory: (categoryId: ColorCategoryId, enabled: boolean) => void;
	onAddProductColor: (category: ColorCategoryId, input: { name: string; hex_color: string }) => void;
	onRemoveProductColor: (category: ColorCategoryId, colorId: string) => void;
	getGlobalColorMatAllowed: (colorId: string, globalDefault: boolean) => boolean;
	onToggleGlobalColorMat: (colorId: string, globalDefault: boolean, enabled: boolean) => void;
	onToggleProductColorMat: (category: ColorCategoryId, colorId: string, enabled: boolean) => void;
	onAllowCustomColorChange: (enabled: boolean) => void;
	onEnableAllColors: () => void;
	onDisableAllColors: () => void;
};

export function StandConfigSection({
	configOptions,
	colorCategories,
	disabledColorIds,
	disabledCategoryIds,
	productColors,
	allowCustomColor,
	onToggleColor,
	onToggleCategory,
	onAddProductColor,
	onRemoveProductColor,
	getGlobalColorMatAllowed,
	onToggleGlobalColorMat,
	onToggleProductColorMat,
	onAllowCustomColorChange,
	onEnableAllColors,
	onDisableAllColors,
}: Props) {
	const colorOptions = configOptions.filter((o) => o.type === "color");
	const allColorsDisabled =
		colorOptions.length > 0 && colorOptions.every((o) => disabledColorIds.has(o.id));

	return (
		<div className="flex flex-col gap-5">
			<div>
				<h2 className="text-sm font-medium text-foreground">Kolory podstawki</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Klient wybierze kolor podstawki po zaznaczeniu opcji (+{STAND_SURCHARGE_PLN} zł / szt.).
					Paleta globalna:{" "}
					<Link
						href={GLOBAL_COLORS_PATH}
						className="text-primary underline-offset-4 hover:underline"
					>
						ustawienia sklepu
					</Link>
					.
				</p>
			</div>

			{colorOptions.length > 0 ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={allColorsDisabled ? onEnableAllColors : onDisableAllColors}
					className="h-8 w-fit"
				>
					{allColorsDisabled ? "Włącz wszystkie kolory" : "Wyłącz wszystkie kolory"}
				</Button>
			) : null}

			<div className="flex flex-col gap-5">
				{colorCategories.map((section) => {
					const globalOpts = colorsInCategory(configOptions, section.id);
					const productOpts = productColors[section.id] ?? [];
					const categoryEnabled = !disabledCategoryIds.has(section.id);

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
										aria-label={`${categoryEnabled ? "Wyłącz" : "Włącz"} kategorię ${section.label} dla podstawki`}
									/>
								</div>
							</div>

							{categoryEnabled && globalOpts.length > 0 ? (
								<div className="mt-2 flex flex-col gap-2">
									{globalOpts.map((opt) => {
										const enabled = !disabledColorIds.has(opt.id);
										const matAllowed = getGlobalColorMatAllowed(opt.id, opt.mat_allowed);
										return (
											<div
												key={opt.id}
												className={cn(
													"flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-sm",
													enabled
														? "border-border bg-background text-foreground"
														: "border-border/60 bg-muted/40 text-muted-foreground",
												)}
											>
												<label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
													<CheckboxInput
														checked={enabled}
														onChange={(checked) => onToggleColor(opt.id, checked)}
														aria-label={`${opt.name} — podstawka`}
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
														aria-label={`Mat ${opt.name} — podstawka`}
													/>
												</div>
											</div>
										);
									})}
								</div>
							) : null}

							{categoryEnabled && productOpts.length > 0 ? (
								<ul className="mt-3 flex flex-col gap-2">
									{productOpts.map((opt) => (
										<li
											key={opt.id}
											className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<ColorSwatch hex={opt.hex_color} />
												<span className="text-sm font-medium">{opt.name}</span>
												<Switch
													checked={opt.mat_allowed}
													onCheckedChange={(checked) =>
														onToggleProductColorMat(section.id, opt.id, checked)
													}
													aria-label={`Mat ${opt.name}`}
												/>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => onRemoveProductColor(section.id, opt.id)}
												className="h-8 text-destructive hover:text-destructive"
											>
												<Trash2 className="size-3.5" aria-hidden />
												Usuń
											</Button>
										</li>
									))}
								</ul>
							) : null}

							{categoryEnabled ? (
								<AddProductColorForm
									category={section.id}
									slotLabel="Podstawka"
									onAdd={(input) => onAddProductColor(section.id, input)}
								/>
							) : null}

							{categoryEnabled && section.id === "custom" ? (
								<label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
									<CheckboxInput
										checked={allowCustomColor}
										onChange={onAllowCustomColorChange}
										aria-label="Własny kolor HEX podstawki"
									/>
									<span>Własny kolor HEX od klienta</span>
								</label>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}
