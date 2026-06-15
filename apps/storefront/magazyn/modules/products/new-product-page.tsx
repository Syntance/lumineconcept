import { loadAdmin } from "@moduly/magazyn-core";
import { getColorCategories } from "@moduly/magazyn-core";
import { listCategoryOptions, listGlobalConfigOptions } from "./store";
import { ProductForm } from "./product-form";

/**
 * Nowy produkt. Re-eksportuj w `app{basePath}/(panel)/produkty/nowy/page.tsx`:
 *   export { default, dynamic } from "@magazyn/modules/products/new-product-page";
 */
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
	const [categories, configOptions, colorCategories] = await loadAdmin(() =>
		Promise.all([listCategoryOptions(), listGlobalConfigOptions(), getColorCategories()]),
	);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Nowy produkt</h1>
			</header>
			<ProductForm
				categories={categories}
				configOptions={configOptions}
				colorCategories={colorCategories}
			/>
		</div>
	);
}
