"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import {
	type ColorCategoryId,
	normalizeHexInput,
} from "./color-categories";

type Props = {
	category: ColorCategoryId;
	slotLabel: string;
	onAdd: (input: { name: string; hex_color: string }) => void;
};

export function AddProductColorForm({ category, slotLabel, onAdd }: Props) {
	const [name, setName] = useState("");
	const [hex, setHex] = useState("#");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	function handleAdd() {
		setError(null);
		const trimmedName = name.trim();
		const normalizedHex = normalizeHexInput(hex);
		if (trimmedName.length < 2) {
			setError("Nazwa musi mieć min. 2 znaki.");
			return;
		}
		if (!normalizedHex) {
			setError("Podaj poprawny kolor HEX (np. #AF7C61).");
			return;
		}
		setPending(true);
		try {
			onAdd({ name: trimmedName, hex_color: normalizedHex });
			setName("");
			setHex("#");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Nie udało się dodać koloru.");
		} finally {
			setPending(false);
		}
	}

	function onFieldKeyDown(event: React.KeyboardEvent) {
		if (event.key !== "Enter") return;
		event.preventDefault();
		handleAdd();
	}

	const previewHex = normalizeHexInput(hex);

	return (
		<div
			role="group"
			aria-label={`Dodaj kolor tylko dla tego produktu (${slotLabel})`}
			className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 p-3"
		>
			<p className="text-xs font-medium text-muted-foreground">
				Dodaj kolor tylko dla tego produktu ({slotLabel})
			</p>
			<div className="flex flex-wrap items-end gap-2">
				<div className="flex min-w-[8rem] flex-1 flex-col gap-1">
					<label className="text-xs text-muted-foreground" htmlFor={`product-color-name-${category}`}>
						Nazwa
					</label>
					<Input
						id={`product-color-name-${category}`}
						value={name}
						onChange={(e) => setName(e.target.value)}
						onKeyDown={onFieldKeyDown}
						placeholder="np. grafitowy"
						className="h-9"
						minLength={2}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-xs text-muted-foreground" htmlFor={`product-color-hex-${category}`}>
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
							id={`product-color-hex-${category}`}
							value={hex}
							onChange={(e) => setHex(e.target.value)}
							onKeyDown={onFieldKeyDown}
							placeholder="#AF7C61"
							className="h-9 w-28 font-mono text-sm"
						/>
					</div>
				</div>
				<Button type="button" size="sm" disabled={pending} onClick={handleAdd} className="h-9 gap-1">
					{pending ? (
						<Loader2 className="size-3.5 animate-spin" aria-hidden />
					) : (
						<Plus className="size-3.5" aria-hidden />
					)}
					Dodaj
				</Button>
			</div>
			{error ? (
				<p role="alert" className="text-xs text-destructive">
					{error}
				</p>
			) : null}
		</div>
	);
}
