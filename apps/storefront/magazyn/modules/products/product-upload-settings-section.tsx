"use client";

import { Input } from "@magazyn/core/ui/input";
import { Switch } from "@magazyn/core/ui/switch";
import { cn } from "@magazyn/core/lib/cn";
import { MAX_PRODUCT_UPLOADS, MIN_PRODUCT_UPLOADS } from "@/lib/products/upload-settings";

type Props = {
	enabled: boolean;
	required: boolean;
	count: number;
	label: string;
	onEnabledChange: (enabled: boolean) => void;
	onRequiredChange: (required: boolean) => void;
	onCountChange: (count: number) => void;
	onLabelChange: (label: string) => void;
	embedded?: boolean;
};

export function ProductUploadSettingsSection({
	enabled,
	required,
	count,
	label,
	onEnabledChange,
	onRequiredChange,
	onCountChange,
	onLabelChange,
	embedded = false,
}: Props) {
	return (
		<div
			className={cn(
				"flex flex-col gap-5",
				!embedded && "rounded-xl border border-border bg-card p-5",
				embedded && "border-t border-border pt-8",
			)}
		>
			<div>
				<h2 className="text-sm font-medium text-foreground">Wgrywanie plików</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Sekcja uploadu w konfiguratorze sklepu — np. logo lub elementy graficzne do personalizacji.
				</p>
			</div>

			<div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3">
				<div>
					<p className="text-sm font-medium text-foreground">Dodaj pole na pliki</p>
					<p className="text-xs text-muted-foreground">
						{enabled
							? "Klient zobaczy sekcję wgrywania w konfiguratorze."
							: "Wyłączone — brak sekcji uploadu na stronie produktu."}
					</p>
				</div>
				<Switch
					checked={enabled}
					onCheckedChange={onEnabledChange}
					aria-label={enabled ? "Wyłącz pole na pliki" : "Włącz pole na pliki"}
				/>
			</div>

			{enabled ? (
				<>
					<div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3">
						<div>
							<p className="text-sm font-medium text-foreground">Wymagane do dodania do koszyka</p>
							<p className="text-xs text-muted-foreground">
								{required
									? "Bez pliku klient nie doda produktu do koszyka."
									: "Upload opcjonalny — klient może złożyć zamówienie bez pliku."}
							</p>
						</div>
						<Switch
							checked={required}
							onCheckedChange={onRequiredChange}
							aria-label={
								required
									? "Ustaw wgrywanie jako opcjonalne"
									: "Ustaw wgrywanie jako wymagane"
							}
						/>
					</div>

					<div className="grid gap-4 rounded-lg border border-border/70 p-4 sm:grid-cols-2">
						<div className="flex flex-col gap-1.5 sm:col-span-2">
							<label htmlFor="product-upload-label" className="text-sm font-medium">
								Nagłówek sekcji (opcjonalnie)
							</label>
							<Input
								id="product-upload-label"
								value={label}
								onChange={(e) => onLabelChange(e.target.value)}
								placeholder="Wgraj swoje logo"
								className="h-10"
							/>
							<p className="text-xs text-muted-foreground">
								Pusty = domyślny tekst w konfiguratorze: „Wgraj swoje logo”
							</p>
						</div>

						<div className="flex flex-col gap-1.5">
							<label htmlFor="product-upload-count" className="text-sm font-medium">
								Maks. liczba plików ({MIN_PRODUCT_UPLOADS}–{MAX_PRODUCT_UPLOADS})
							</label>
							<Input
								id="product-upload-count"
								type="number"
								min={MIN_PRODUCT_UPLOADS}
								max={MAX_PRODUCT_UPLOADS}
								value={count}
								onChange={(e) => {
									const parsed = Number.parseInt(e.target.value, 10);
									if (!Number.isFinite(parsed)) return;
									onCountChange(
										Math.min(MAX_PRODUCT_UPLOADS, Math.max(MIN_PRODUCT_UPLOADS, parsed)),
									);
								}}
								className="h-10 w-28"
							/>
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}
