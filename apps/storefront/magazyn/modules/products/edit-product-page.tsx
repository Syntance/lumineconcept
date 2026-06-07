import { notFound } from "next/navigation";
import { loadAdmin } from "@magazyn/core/auth/load";
import { getAdminProduct, listCategoryOptions, listGlobalConfigOptions } from "./store";
import { ProductForm } from "./product-form";

/**
 * Edycja produktu. Re-eksportuj w `app{basePath}/(panel)/produkty/[id]/page.tsx`:
 *   export { default, dynamic } from "@magazyn/modules/products/edit-product-page";
 */
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [product, categories, configOptions] = await loadAdmin(() =>
		Promise.all([getAdminProduct(id), listCategoryOptions(), listGlobalConfigOptions()]),
	);
	if (!product) notFound();

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Edytuj produkt</h1>
				<p className="mt-1 text-sm text-muted-foreground">/{product.handle}</p>
			</header>
			<ProductForm product={product} categories={categories} configOptions={configOptions} />
		</div>
	);
}
