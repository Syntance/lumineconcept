"use client";

import { Input } from "@magazyn/core/ui/input";
import { Switch } from "@magazyn/core/ui/switch";
import { cn } from "@magazyn/core/lib/cn";
import { MAX_PRODUCT_UPLOADS, MIN_PRODUCT_UPLOADS } from "@/lib/products/upload-settings";

type Props = {
	enabled: boolean;
	count: number;
	label: string;
	onEnabledChange: (enabled: boolean) => void;
	onCountChange: (count: number) => void;
	onLabelChange: (label: string) => void;
	embedded?: boolean;
};

export function ProductUploadSettingsSection({
	enabled,
	count,
	label,
	onEnabledChange,
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
					Klient musi wgrać co najmniej jeden plik przed dodaniem produktu do koszyka — np. logo
					lub elementy graficzne do personalizacji.
				</p>
			</div>

			<div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3">
				<div>
					<p className="text-sm font-medium text-foreground">Wymagaj wgrywania pliku</p>
					<p className="text-xs text-muted-foreground">
						{enabled
							? "Sekcja uploadu pojawi się w konfiguratorze sklepu."
							: "Wyłączone — klient nie musi wgrywać plików."}
					</p>
				</div>
				<Switch
					checked={enabled}
					onCheckedChange={onEnabledChange}
					aria-label={enabled ? "Wyłącz wgrywanie plików" : "Włącz wgrywanie plików"}
				/>
			</div>

			{enabled ? (
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
								onCountChange(Math.min(MAX_PRODUCT_UPLOADS, Math.max(MIN_PRODUCT_UPLOADS, parsed)));
							}}
							className="h-10 w-28"
						/>
					</div>
				</div>
			) : null}
		</div>
	);
}
