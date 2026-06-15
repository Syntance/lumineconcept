"use client";

import { Input } from "@moduly/ui";
import { CheckboxInput } from "@moduly/ui";
import { cn } from "@moduly/ui";
import type { TextFieldDef } from "@/lib/products/text-fields";
import { TextFieldPicker } from "./text-field-picker";

const inputClass =
	"w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Props = {
	fields: TextFieldDef[];
	activeFieldKey: string;
	onActiveFieldChange: (key: string) => void;
	onAddField: () => void;
	onRemoveField: (fieldKey: string) => void;
	onRenameField: (fieldKey: string, newLabel: string) => void;
	onUpdateField: (fieldKey: string, patch: Partial<TextFieldDef>) => void;
	embedded?: boolean;
};

export function TextFieldsSection({
	fields,
	activeFieldKey,
	onActiveFieldChange,
	onAddField,
	onRemoveField,
	onRenameField,
	onUpdateField,
	embedded = false,
}: Props) {
	const activeField = fields.find((f) => f.key === activeFieldKey);

	return (
		<div
			className={cn(
				"flex flex-col gap-5",
				!embedded && "rounded-xl border border-border bg-card p-5",
			)}
		>
			<div>
				<h2 className="text-sm font-medium text-foreground">Pola tekstowe (personalizacja)</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Dodaj pola, które klient wypełnia w konfiguratorze produktu — np. nazwa salonu, tekst na tabliczce.
				</p>
			</div>

			<TextFieldPicker
				fields={fields}
				activeFieldKey={activeFieldKey}
				onActiveFieldChange={onActiveFieldChange}
				onAddField={onAddField}
				onRemoveField={onRemoveField}
				onRenameField={onRenameField}
			/>

			{activeField ? (
				<div className="grid gap-4 rounded-lg border border-border/70 p-4 sm:grid-cols-2">
					<div className="flex flex-col gap-1.5 sm:col-span-2">
						<label htmlFor="text-field-label" className="text-sm font-medium">
							Tytuł pola
						</label>
						<Input
							id="text-field-label"
							value={activeField.label}
							onChange={(e) => onUpdateField(activeField.key, { label: e.target.value })}
							placeholder="np. Tekst na górze"
							className="h-10"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="text-field-key" className="text-sm font-medium">
							Klucz (techniczny)
						</label>
						<Input
							id="text-field-key"
							value={activeField.key}
							onChange={(e) => onUpdateField(activeField.key, { key: e.target.value.trim() })}
							placeholder="tekst_na_gorze"
							className="h-10 font-mono text-xs"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label htmlFor="text-field-max" className="text-sm font-medium">
							Maks. znaków
						</label>
						<Input
							id="text-field-max"
							type="number"
							min={1}
							max={1000}
							value={activeField.maxLength ?? 200}
							onChange={(e) =>
								onUpdateField(activeField.key, {
									maxLength: Number.parseInt(e.target.value, 10) || 200,
								})
							}
							className="h-10"
						/>
					</div>

					<div className="flex flex-col gap-1.5 sm:col-span-2">
						<label htmlFor="text-field-hint" className="text-sm font-medium">
							Podpowiedź (opcjonalnie)
						</label>
						<Input
							id="text-field-hint"
							value={activeField.hint ?? ""}
							onChange={(e) => onUpdateField(activeField.key, { hint: e.target.value })}
							placeholder="Krótki opis pod tytułem pola"
							className="h-10"
						/>
					</div>

					<div className="flex flex-col gap-1.5 sm:col-span-2">
						<label htmlFor="text-field-placeholder" className="text-sm font-medium">
							Placeholder
						</label>
						<textarea
							id="text-field-placeholder"
							value={activeField.placeholder ?? ""}
							onChange={(e) => onUpdateField(activeField.key, { placeholder: e.target.value })}
							rows={3}
							className={inputClass}
							placeholder={"np. Wpisz nazwę salonu…\nDruga linia pod spodem"}
						/>
					</div>

					<label className="flex items-center gap-2.5 text-sm">
						<CheckboxInput
							checked={activeField.required ?? false}
							onChange={(required) => onUpdateField(activeField.key, { required })}
							aria-label="Pole wymagane"
						/>
						Wymagane
					</label>
				</div>
			) : null}
		</div>
	);
}
