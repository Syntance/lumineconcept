import { getPageContent } from "@/lib/content";
import { cmsAttr } from "@/lib/cms-preview/attr";
import {
	resolveBestsellerProducts,
	resolveBestsellersTitle,
} from "@/lib/bestsellers/resolve-bestsellers";
import { BestsellersGrid } from "./BestsellersGrid";

export async function BestsellersSection() {
	let pageContent: Awaited<ReturnType<typeof getPageContent>>;
	try {
		pageContent = await getPageContent("home");
	} catch (err) {
		console.error("[BestsellersSection] Failed to load CMS:", err);
		return null;
	}

	let products: Awaited<ReturnType<typeof resolveBestsellerProducts>>;
	try {
		products = await resolveBestsellerProducts(pageContent.bestsellers);
	} catch (err) {
		console.error("[BestsellersSection] Failed to fetch products:", err);
		return null;
	}

	if (!products.length) return null;

	return (
		<BestsellersGrid
			title={resolveBestsellersTitle(pageContent.bestsellers)}
			products={products}
			cmsField={await cmsAttr("page.home.bestsellers")}
		/>
	);
}
