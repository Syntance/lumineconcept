"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@moduly/ui";
import { Input } from "@moduly/ui";
import {
	type ColorCategoryDefinition,
	type ColorCategoryId,
	resolveHexInputOrTransparent,
} from "@magazyn/modules/products/color-categories";
import { ColorSwatch, colorsInCategory, sortConfigOptions } from "@magazyn/modules/products/color-ui";
import type { ConfigOption } from "@magazyn/modules/products/store";
import {
	createColorCategoryAction,
	createColorOptionAction,
	deleteColorCategoryAction,
	deleteColorOptionAction,
	updateColorOptionMatAction,
} from "./actions";
import { Switch } from "@moduly/ui";

function AddColorForm({
	category,
	onAdded,
}: {
	category: ColorCategoryId;
	onAdded: (option: ConfigOption) => void;
}) {
	const [name, setName] = useState("");
	const [hex, setHex] = useState("#");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function handleAdd() {
		setError(null);
		startTransition(async () => {
			const result = await createColorOptionAction({
				name,
				hex_color: hex,
				color_category: category,
			});
			if (!result.ok || !result.option) {
				setError(result.error ?? "Nie udało się dodać koloru.");
				return;
			}
			onAdded(result.option);
			setName("");
			setHex("#");
		});
	}

	function onFieldKeyDown(event: React.KeyboardEvent) {
		if (event.key !== "Enter") return;
		event.preventDefault();
		handleAdd();
	}

	const previewHex = resolveHexInputOrTransparent(hex);

	return (
		<div
			role="group"
			aria-label="Dodaj kolor do kategorii"
			className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 p-3"
		>
			<p className="text-xs font-medium text-muted-foreground">Dodaj kolor</p>
			<div className="flex flex-wrap items-end gap-2">
				<div className="flex min-w-[8rem] flex-1 flex-col gap-1">
					<label className="text-xs text-muted-foreground" htmlFor={`global-color-name-${category}`}>
						Nazwa
					</label>
					<Input
						id={`global-color-name-${category}`}
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={onFieldKeyDown}
						placeholder="np. grafitowy"
						className="h-9"
						minLength={2}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-xs text-muted-foreground" htmlFor={`global-color-hex-${category}`}>
						HEX
					</label>
					<div className="flex items-center gap-2">
						{previewHex && previewHex !== "transparent" ? (
							<span
								className="size-9 shrink-0 rounded-md border border-border"
								style={{ backgroundColor: previewHex }}
								aria-hidden
							/>
						) : (
							<span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
								∅
							</span>
						)}
						<Input
							id={`global-color-hex-${category}`}
							value={hex}
							onChange={(e) => setHex(e.target.value)}
							onKeyDown={onFieldKeyDown}
							placeholder="#AF7C61"
							className="h-9 w-28 font-mono text-sm"
						/>
					</div>
				</div>
				<Button type="button" size="sm" disabled={pending} onClick={handleAdd} className="h-9 gap-1">
					{pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
					Dodaj
				</Button>
			</div>
			{error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
		</div>
	);
}

type Props = {
	initialOptions: ConfigOption[];
	initialCategories: ColorCategoryDefinition[];
};

export function GlobalColorsManager({ initialOptions, initialCategories }: Props) {
	const [options, setOptions] = useState(() => sortConfigOptions(initialOptions));
	const [categories, setCategories] = useState(initialCategories);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [updatingMatId, setUpdatingMatId] = useState<string | null>(null);
	const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [categoryError, setCategoryError] = useState<string | null>(null);
	const [newCategoryLabel, setNewCategoryLabel] = useState("");
	const [, startDelete] = useTransition();
	const [, startMatUpdate] = useTransition();
	const [addingCategory, startAddCategory] = useTransition();

	const colorCount = options.filter((o) => o.type === "color").length;

	function handleAdded(option: ConfigOption) {
		setOptions((prev) => sortConfigOptions([...prev, option]));
	}

	function handleDelete(id: string, name: string) {
		if (!window.confirm(`Usunąć kolor „${name}” z globalnej palety? Zniknie ze wszystkich produktów.`)) {
			return;
		}
		setDeleteError(null);
		setDeletingId(id);
		startDelete(async () => {
			const result = await deleteColorOptionAction(id);
			setDeletingId(null);
			if (!result.ok) {
				setDeleteError(result.error ?? "Nie udało się usunąć koloru.");
				return;
			}
			setOptions((prev) => prev.filter((o) => o.id !== id));
		});
	}

	function handleAddCategory() {
		setCategoryError(null);
		startAddCategory(async () => {
			const result = await createColorCategoryAction(newCategoryLabel);
			if (!result.ok || !result.category) {
				setCategoryError(result.error ?? "Nie udało się dodać kategorii.");
				return;
			}
			setCategories((prev) => [...prev, result.category!]);
			setNewCategoryLabel("");
		});
	}

	function handleMatChange(id: string, matAllowed: boolean) {
		setDeleteError(null);
		setUpdatingMatId(id);
		startMatUpdate(async () => {
			const result = await updateColorOptionMatAction(id, matAllowed);
			setUpdatingMatId(null);
			if (!result.ok || !result.option) {
				setDeleteError(result.error ?? "Nie udało się zaktualizować opcji mat.");
				return;
			}
			setOptions((prev) =>
				prev.map((option) => (option.id === id ? { ...option, mat_allowed: result.option!.mat_allowed } : option)),
			);
		});
	}

	function handleDeleteCategory(categoryId: string, label: string) {
		if (!window.confirm(`Usunąć kategorię „${label}”? Działa tylko gdy nie ma w niej kolorów.`)) {
			return;
		}
		setCategoryError(null);
		setDeletingCategoryId(categoryId);
		startDelete(async () => {
			const result = await deleteColorCategoryAction(categoryId);
			setDeletingCategoryId(null);
			if (!result.ok) {
				setCategoryError(result.error ?? "Nie udało się usunąć kategorii.");
				return;
			}
			if (result.categories) {
				setCategories(result.categories);
			}
		});
	}

	return (
		<div className="flex flex-col gap-5">
			<div className="rounded-xl border border-border bg-card p-5">
				<p className="text-sm text-muted-foreground">
					Kolory zdefiniowane tutaj są domyślnie dostępne w konfiguratorze każdego produktu.
					Nowy produkt automatycznie dziedziczy całą paletę — wyłączenia ustawiasz przy edycji produktu.
				</p>
				<p className="mt-2 text-sm font-medium text-foreground">
					Aktualnie w palecie: {colorCount} {colorCount === 1 ? "kolor" : "kolorów"}
				</p>
			</div>

			<div className="rounded-xl border border-border bg-card p-5">
				<h2 className="text-sm font-medium text-foreground">Kategorie kolorów</h2>
				<p className="mt-1 text-xs text-muted-foreground">
					Grupy w konfiguratorze (np. Standardowe, Lustrzane). Pusta kategorię możesz usunąć.
				</p>
				<div className="mt-3 flex flex-wrap items-end gap-2">
					<div className="flex min-w-[12rem] flex-1 flex-col gap-1">
						<label className="text-xs text-muted-foreground" htmlFor="new-color-category">
							Nowa kategoria
						</label>
						<Input
							id="new-color-category"
							value={newCategoryLabel}
							onChange={(e) => setNewCategoryLabel(e.target.value)}
							placeholder="np. Metaliczne"
							className="h-9"
							minLength={2}
						/>
					</div>
					<Button
						type="button"
						size="sm"
						disabled={addingCategory}
						onClick={handleAddCategory}
						className="h-9 gap-1"
					>
						{addingCategory ? (
							<Loader2 className="size-3.5 animate-spin" aria-hidden />
						) : (
							<Plus className="size-3.5" aria-hidden />
						)}
						Dodaj kategorię
					</Button>
				</div>
				{categoryError ? (
					<p role="alert" className="mt-2 text-xs text-destructive">
						{categoryError}
					</p>
				) : null}
			</div>

			{deleteError ? <p role="alert" className="text-sm text-destructive">{deleteError}</p> : null}

			<div className="flex flex-col gap-6">
				{categories.map((section) => {
					const opts = colorsInCategory(options, section.id);
					const canDeleteCategory = categories.length > 1 && opts.length === 0;

					return (
						<div key={section.id} className="rounded-xl border border-border bg-card p-5">
							<div className="flex items-start justify-between gap-3">
								<h2 className="text-sm font-medium text-foreground">{section.label}</h2>
								{canDeleteCategory ? (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										disabled={deletingCategoryId === section.id}
										onClick={() => handleDeleteCategory(section.id, section.label)}
										className="h-8 gap-1 text-destructive hover:text-destructive"
										aria-label={`Usuń kategorię ${section.label}`}
									>
										{deletingCategoryId === section.id ? (
											<Loader2 className="size-3.5 animate-spin" aria-hidden />
										) : (
											<Trash2 className="size-3.5" aria-hidden />
										)}
										Usuń kategorię
									</Button>
								) : null}
							</div>

							{opts.length > 0 ? (
								<ul className="mt-3 flex flex-col gap-2">
									{opts.map((opt) => (
										<li
											key={opt.id}
											className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
										>
											<div className="flex min-w-0 flex-1 items-center gap-3">
												<div className="flex min-w-0 items-center gap-2 text-sm">
													<ColorSwatch hex={opt.hex_color} />
													<span className="font-medium">{opt.name}</span>
													<span className="font-mono text-xs text-muted-foreground">
														{opt.hex_color ?? "—"}
													</span>
												</div>
												<div className="flex shrink-0 items-center gap-2 border-l border-border pl-3">
													<span className="text-xs text-muted-foreground">Mat</span>
													<Switch
														checked={opt.mat_allowed}
														disabled={updatingMatId === opt.id}
														onCheckedChange={(checked) => handleMatChange(opt.id, checked)}
														aria-label={`${opt.mat_allowed ? "Wyłącz" : "Włącz"} mat dla koloru ${opt.name}`}
													/>
												</div>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={deletingId === opt.id}
												onClick={() => handleDelete(opt.id, opt.name)}
												className="h-8 gap-1 text-destructive hover:text-destructive"
												aria-label={`Usuń kolor ${opt.name}`}
											>
												{deletingId === opt.id ? (
													<Loader2 className="size-3.5 animate-spin" aria-hidden />
												) : (
													<Trash2 className="size-3.5" aria-hidden />
												)}
												Usuń
											</Button>
										</li>
									))}
								</ul>
							) : (
								<p className="mt-2 text-sm text-muted-foreground">Brak kolorów w tej kategorii.</p>
							)}

							<AddColorForm category={section.id} onAdded={handleAdded} />
						</div>
					);
				})}
			</div>
		</div>
	);
}
