import { loadAdmin } from "@magazyn/core/auth/load";
import { listGlobalConfigOptions } from "@magazyn/modules/products/store";
import { getColorCategories } from "./color-category-store";
import { GlobalColorsManager } from "./global-colors-manager";

export const dynamic = "force-dynamic";

export default async function GlobalColorsPage() {
	const [options, categories] = await loadAdmin(() =>
		Promise.all([listGlobalConfigOptions(), getColorCategories()]),
	);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Kolory</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Globalna paleta konfiguratora — każdy nowy produkt startuje z pełnym zestawem tych kolorów.
				</p>
			</header>

			<GlobalColorsManager initialOptions={options} initialCategories={categories} />
		</div>
	);
}
