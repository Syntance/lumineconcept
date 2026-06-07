"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import {
	COLOR_CATEGORY_SECTIONS,
	type ColorCategoryId,
	normalizeHexInput,
} from "@magazyn/modules/products/color-categories";
import { ColorSwatch, colorsInCategory, sortConfigOptions } from "@magazyn/modules/products/color-ui";
import type { ConfigOption } from "@magazyn/modules/products/store";
import { createColorOptionAction, deleteColorOptionAction } from "./actions";

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

	function onSubmit(event: React.FormEvent) {
		event.preventDefault();
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

	const previewHex = normalizeHexInput(hex);

	return (
		<form
			onSubmit={onSubmit}
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
						placeholder="np. grafitowy"
						className="h-9"
						required
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
							placeholder="#AF7C61"
							className="h-9 w-28 font-mono text-sm"
							required
						/>
					</div>
				</div>
				<Button type="submit" size="sm" disabled={pending} className="h-9 gap-1">
					{pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Plus className="size-3.5" aria-hidden />}
					Dodaj
				</Button>
			</div>
			{error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
		</form>
	);
}

type Props = {
	initialOptions: ConfigOption[];
};

export function GlobalColorsManager({ initialOptions }: Props) {
	const [options, setOptions] = useState(() => sortConfigOptions(initialOptions));
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [, startDelete] = useTransition();

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

			{deleteError ? <p role="alert" className="text-sm text-destructive">{deleteError}</p> : null}

			<div className="flex flex-col gap-6">
				{COLOR_CATEGORY_SECTIONS.map((section) => {
					const opts = colorsInCategory(options, section.id);
					return (
						<div key={section.id} className="rounded-xl border border-border bg-card p-5">
							<h2 className="text-sm font-medium text-foreground">{section.label}</h2>
							{opts.length > 0 ? (
								<ul className="mt-3 flex flex-col gap-2">
									{opts.map((opt) => (
										<li
											key={opt.id}
											className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
										>
											<div className="flex items-center gap-2 text-sm">
												<ColorSwatch hex={opt.hex_color} />
												<span className="font-medium">{opt.name}</span>
												<span className="font-mono text-xs text-muted-foreground">
													{opt.hex_color ?? "—"}
												</span>
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
