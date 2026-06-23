"use client";

import { Loader2, Save, X } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { Switch } from "@magazyn/core/ui/switch";
import { saveShippingOptionAction } from "./actions";
import type { AdminShippingOption } from "./types";

type Props = {
	option: AdminShippingOption;
	onCancel: () => void;
	onSaved: () => void;
};

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function isFlatPriceType(priceType: string | null): boolean {
	return priceType === "flat" || priceType === "flat_rate";
}

function optionToFormValues(option: AdminShippingOption) {
	return {
		name: option.name,
		priceMajor: option.priceMinor / 100,
		typeLabel: option.typeLabel ?? "",
		typeDescription: option.typeDescription ?? "",
		checkoutEnabled: option.checkoutEnabled,
	};
}

export function ShippingOptionForm({ option, onCancel, onSaved }: Props) {
	const nameId = useId();
	const priceId = useId();
	const labelId = useId();
	const descriptionId = useId();
	const checkoutId = useId();

	const [form, setForm] = useState(() => optionToFormValues(option));
	const [error, setError] = useState<string | null>(null);
	const [saving, startSave] = useTransition();

	const priceEditable = isFlatPriceType(option.priceType);

	useEffect(() => {
		setForm(optionToFormValues(option));
	}, [option]);

	function handleSubmit() {
		setError(null);
		startSave(async () => {
			const result = await saveShippingOptionAction({
				optionId: option.id,
				...form,
			});
			if (!result.ok) {
				setError(result.error);
				return;
			}
			onSaved();
		});
	}

	return (
		<div className="rounded-xl border border-border bg-card p-4 sm:p-6">
			<div className="mb-4 flex items-center justify-between gap-3">
				<h2 className="font-medium text-foreground">Edycja metody dostawy</h2>
				<Button type="button" variant="ghost" size="sm" onClick={onCancel}>
					<X className="size-4" aria-hidden />
					Anuluj
				</Button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="sm:col-span-2">
					<label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-foreground">
						Nazwa w checkoutcie
					</label>
					<Input
						id={nameId}
						className={inputClass}
						value={form.name}
						onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
						placeholder="np. Kurier DPD"
					/>
				</div>

				<div>
					<label htmlFor={priceId} className="mb-1.5 block text-sm font-medium text-foreground">
						Cena (PLN)
					</label>
					<Input
						id={priceId}
						type="number"
						min={0}
						step={0.01}
						className={inputClass}
						value={Number.isFinite(form.priceMajor) ? form.priceMajor : 0}
						disabled={!priceEditable}
						onChange={(e) =>
							setForm((prev) => ({
								...prev,
								priceMajor: Number.parseFloat(e.target.value) || 0,
							}))
						}
					/>
					{!priceEditable ? (
						<p className="mt-1 text-xs text-muted-foreground">
							Cena wyliczana przez providera — edycja niedostępna.
						</p>
					) : null}
				</div>

				<div>
					<label htmlFor={labelId} className="mb-1.5 block text-sm font-medium text-foreground">
						Etykieta typu
					</label>
					<Input
						id={labelId}
						className={inputClass}
						value={form.typeLabel}
						onChange={(e) => setForm((prev) => ({ ...prev, typeLabel: e.target.value }))}
						placeholder="np. Kurier"
					/>
				</div>

				<div className="sm:col-span-2">
					<label
						htmlFor={descriptionId}
						className="mb-1.5 block text-sm font-medium text-foreground"
					>
						Opis (widoczny przy wyborze dostawy)
					</label>
					<textarea
						id={descriptionId}
						rows={2}
						className={inputClass}
						value={form.typeDescription}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, typeDescription: e.target.value }))
						}
						placeholder="np. Dostawa kurierem DPD na terenie Polski"
					/>
				</div>

				<div className="flex items-center gap-3 sm:col-span-2">
					<Switch
						id={checkoutId}
						checked={form.checkoutEnabled}
						onCheckedChange={(checked) =>
							setForm((prev) => ({ ...prev, checkoutEnabled: checked }))
						}
						aria-label="Widoczna w checkoutcie sklepu"
					/>
					<label htmlFor={checkoutId} className="text-sm text-foreground">
						Widoczna w checkoutcie sklepu
					</label>
				</div>
			</div>

			{option.typeCode ? (
				<p className="mt-3 text-xs text-muted-foreground">
					Kod techniczny Medusy: <span className="font-mono">{option.typeCode}</span>
				</p>
			) : null}

			{error ? (
				<p className="mt-4 text-sm text-destructive" role="alert">
					{error}
				</p>
			) : null}

			<div className="mt-6 flex justify-end">
				<Button type="button" onClick={handleSubmit} disabled={saving}>
					{saving ? (
						<Loader2 className="size-4 animate-spin" aria-hidden />
					) : (
						<Save className="size-4" aria-hidden />
					)}
					Zapisz zmiany
				</Button>
			</div>
		</div>
	);
}
