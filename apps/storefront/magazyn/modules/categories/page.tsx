import { loadAdmin } from "@magazyn/core/auth/load";
import { listCategories } from "./store";
import { CategoriesManager } from "./categories-manager";

/**
 * Strona kategorii. Re-eksportuj w `app{basePath}/(panel)/kategorie/page.tsx`:
 *   export { default, dynamic } from "@magazyn/modules/categories/page";
 */
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
	const categories = await loadAdmin(listCategories);

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="font-serif text-2xl text-foreground">Kategorie</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Podkategorie listingu „Gotowe wzory” — te same pozycje co w filtrach sklepu. Produkty przypisujesz przy edycji.
				</p>
			</header>

			<CategoriesManager categories={categories} />
		</div>
	);
}
