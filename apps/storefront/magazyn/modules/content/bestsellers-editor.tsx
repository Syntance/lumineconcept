"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@magazyn/core/ui/button";
import { Input } from "@magazyn/core/ui/input";
import { cn } from "@magazyn/core/lib/cn";
import type { BestsellersContent } from "@/lib/content/types";
import { BESTSELLERS_DEFAULT_TITLE, BESTSELLERS_DISPLAY_LIMIT } from "@/lib/bestsellers/resolve-bestsellers";
import type { CmsProductOption } from "./product-options";

type Props = {
	value?: BestsellersContent;
	onChange: (value: BestsellersContent) => void;
	products: CmsProductOption[];
};

export function BestsellersEditor({ value, onChange, products }: Props) {
	const config: BestsellersContent = value ?? { productIds: [] };
	const [query, setQuery] = useState("");

	const productById = useMemo(
		() => new Map(products.map((product) => [product.id, product])),
		[products],
	);

	const selected = config.productIds
		.map((id) => productById.get(id))
		.filter((product): product is CmsProductOption => product != null);

	const available = useMemo(() => {
		const selectedSet = new Set(config.productIds);
		const q = query.trim().toLowerCase();
		return products.filter((product) => {
			if (selectedSet.has(product.id)) return false;
			if (!q) return true;
			return (
				product.title.toLowerCase().includes(q) ||
				product.handle.toLowerCase().includes(q)
			);
		});
	}, [config.productIds, products, query]);

	function update(patch: Partial<BestsellersContent>) {
		onChange({ ...config, ...patch });
	}

	function addProduct(productId: string) {
		if (config.productIds.includes(productId)) return;
		if (config.productIds.length >= BESTSELLERS_DISPLAY_LIMIT) return;
		update({ productIds: [...config.productIds, productId] });
		setQuery("");
	}

	function removeProduct(productId: string) {
		update({ productIds: config.productIds.filter((id) => id !== productId) });
	}

	function moveProduct(index: number, direction: -1 | 1) {
		const next = [...config.productIds];
		const target = index + direction;
		if (target < 0 || target >= next.length) return;
		const current = next[index];
		const swap = next[target];
		if (!current || !swap) return;
		next[index] = swap;
		next[target] = current;
		update({ productIds: next });
	}

	const atLimit = config.productIds.length >= BESTSELLERS_DISPLAY_LIMIT;

	return (
		<fieldset className="flex flex-col gap-4 rounded-xl border border-border p-4">
			<legend className="px-1 text-sm font-medium">Bestsellery</legend>
			<p className="text-sm text-muted-foreground">
				Wybierz do {BESTSELLERS_DISPLAY_LIMIT} produktów i ustaw kolejność wyświetlania na stronie
				głównej i w sklepie. Gdy lista jest pusta, sklep pokazuje produkty z tagiem „bestseller”.
			</p>

			<label className="flex flex-col gap-1.5 text-sm">
				<span className="font-medium text-foreground">Nagłówek sekcji</span>
				<Input
					value={config.title ?? ""}
					onChange={(e) => update({ title: e.target.value })}
					placeholder={BESTSELLERS_DEFAULT_TITLE}
					className="h-10"
				/>
			</label>

			<div className="flex flex-col gap-2">
				<span className="text-sm font-medium text-foreground">
					Wybrane ({config.productIds.length}/{BESTSELLERS_DISPLAY_LIMIT})
				</span>
				{selected.length === 0 ? (
					<p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
						Brak wybranych produktów — używany będzie fallback z tagiem „bestseller”.
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{selected.map((product, index) => (
							<li
								key={product.id}
								className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
							>
								<span
									className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800"
									aria-hidden
								>
									{index + 1}
								</span>
								{product.thumbnail ? (
									<div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-white">
										<Image
											src={product.thumbnail}
											alt=""
											fill
											className="object-cover"
											sizes="40px"
											unoptimized
										/>
									</div>
								) : (
									<div className="size-10 shrink-0 rounded-md bg-muted" aria-hidden />
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-foreground">{product.title}</p>
									<p className="truncate text-xs text-muted-foreground">/{product.handle}</p>
								</div>
								<div className="flex shrink-0 gap-0.5">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => moveProduct(index, -1)}
										disabled={index === 0}
										aria-label={`Wyżej: ${product.title}`}
									>
										<ChevronUp className="size-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => moveProduct(index, 1)}
										disabled={index === selected.length - 1}
										aria-label={`Niżej: ${product.title}`}
									>
										<ChevronDown className="size-4" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeProduct(product.id)}
										aria-label={`Usuń: ${product.title}`}
									>
										<Trash2 className="size-4 text-destructive" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="flex flex-col gap-2">
				<label className="flex flex-col gap-1.5 text-sm">
					<span className="font-medium text-foreground">Dodaj produkt</span>
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Szukaj po nazwie lub handle…"
						className="h-10"
						disabled={atLimit}
					/>
				</label>
				{atLimit ? (
					<p className="text-xs text-muted-foreground">
						Osiągnięto limit {BESTSELLERS_DISPLAY_LIMIT} produktów — usuń pozycję, aby dodać inną.
					</p>
				) : (
					<ul
						className={cn(
							"max-h-56 overflow-y-auto rounded-lg border border-border",
							available.length === 0 && "px-3 py-4 text-sm text-muted-foreground",
						)}
					>
						{available.length === 0 ? (
							<li>Brak produktów pasujących do wyszukiwania.</li>
						) : (
							available.slice(0, 40).map((product) => (
								<li key={product.id}>
									<button
										type="button"
										onClick={() => addProduct(product.id)}
										className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
									>
										<Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
										<span className="min-w-0 flex-1 truncate font-medium">{product.title}</span>
										<span className="shrink-0 text-xs text-muted-foreground">/{product.handle}</span>
									</button>
								</li>
							))
						)}
					</ul>
				)}
			</div>
		</fieldset>
	);
}
