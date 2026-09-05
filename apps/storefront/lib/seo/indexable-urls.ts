import { medusa } from "@/lib/medusa/client";
import {
	getDirectListingCategoryHandles,
	LISTING_CATEGORY_HANDLE,
	type CategoryTreeNode,
} from "@/lib/medusa/category-tree";
import { getProductCategories } from "@/lib/medusa/products";
import { categoryListingHref } from "@/lib/medusa/shop-breadcrumbs";
import { parseProductSeoFromMetadata } from "@/lib/content/parsers";
import { isProductionBuild, isTransientMedusaError, sleep } from "@/lib/medusa/transient-error";
import { withMedusaTimeout } from "@/lib/medusa/with-timeout";
import { canonicalProductPath, productTagValues } from "@/lib/products/product-canonical";
import { SITE_URL } from "@/lib/utils";

/**
 * Jedno źródło prawdy dla URL-i podawanych robotom (`sitemap.xml`, `llms.txt`).
 *
 * Wcześniej obie trasy miały własną kopię pętli po produktach — i obie gubiły
 * `fields: "+tags"`, przez co `canonicalProductPath` widział pusty zestaw tagów
 * i mapował KAŻDY produkt na `/sklep/gotowe-wzory/<handle>`. Strona produktu
 * (`createProductPage`) pobiera tagi i kanonikalizuje certyfikaty na
 * `/sklep/certyfikaty/<handle>`, a tablice na `/sklep/tablice-z-logo/<handle>`
 * — więc URL z sitemapy wskazywał stronę z `<link rel="canonical">` na inny
 * adres. Google raportuje to jako „Strona alternatywna ze znacznikiem
 * canonical" i nie indeksuje ani wpisu z sitemapy, ani adresu kanonicznego
 * (bo tego drugiego w sitemapie w ogóle nie było).
 */

/** Ile produktów pobieramy na jedno żądanie listy. */
const PRODUCTS_PAGE_SIZE = 200;
/** Twardy limit bezpieczeństwa, gdyby `count` był niewiarygodny. */
const MAX_PRODUCT_PAGES = 100;

/**
 * Obie relacje Store API pomija domyślnie:
 * - bez `+tags` `productTagValues()` zwraca `[]` i kanonizacja się rozjeżdża,
 * - bez `+metadata` nie widać per-produktowego SEO z panelu magazynu
 *   (`seo_no_index`, `seo_canonical_url`).
 */
const PRODUCT_FIELDS = "+tags,+metadata";

/** Railway usypia backend — pierwszy strzał po wybudzeniu potrafi dać 502/504. */
const RETRY_DELAYS = [0, 1200, 2500, 4000];

const SITE_ORIGIN = new URL(SITE_URL).origin;

export interface IndexableProduct {
	title: string;
	/** Absolutny URL kanoniczny — dokładnie ten, który PDP wystawia w `rel="canonical"`. */
	url: string;
	lastModified: Date;
}

/**
 * URL kanoniczny produktu — musi być IDENTYCZNY z tym, co `buildMetadata`
 * ustawia na stronie produktu (`seo?.canonicalUrl || SITE_URL + path`).
 * Rozjazd tych dwóch miejsc to dokładnie ta klasa błędu, przez którą
 * certyfikaty wypadły z indeksu.
 *
 * `null` = produkt kanonizowany na obcą domenę; w naszej sitemapie nie ma
 * czego szukać (Google i tak zignoruje taki wpis).
 */
function canonicalUrlFor(
	handle: string,
	tags: string[],
	canonicalOverride: string | undefined,
): string | null {
	const fallback = `${SITE_URL}${canonicalProductPath(handle, tags)}`;
	const override = canonicalOverride?.trim();
	if (!override) return fallback;

	let parsed: URL;
	try {
		parsed = new URL(override, SITE_URL);
	} catch {
		return fallback;
	}

	if (parsed.origin !== SITE_ORIGIN) return null;
	return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}${parsed.search}`;
}

type MedusaProductPage = Awaited<ReturnType<typeof medusa.store.product.list>>;

/** Jedna strona listy produktów z limitem czasu i retry na błędach przejściowych. */
async function listProductsPage(offset: number): Promise<MedusaProductPage> {
	let lastError: unknown = null;

	for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
		const pause = RETRY_DELAYS[attempt] ?? 0;
		if (pause > 0) await sleep(pause);

		try {
			return await withMedusaTimeout(
				medusa.store.product.list({
					limit: PRODUCTS_PAGE_SIZE,
					offset,
					fields: PRODUCT_FIELDS,
				}),
				30_000,
				"seo product.list",
			);
		} catch (e) {
			lastError = e;
			if (attempt < RETRY_DELAYS.length - 1 && isTransientMedusaError(e)) continue;
			break;
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("seo product.list: nie udało się pobrać produktów");
}

/**
 * Wszystkie opublikowane produkty pod ich kanonicznym adresem (bez duplikatów).
 *
 * Rzuca, gdy Medusa nie odpowiada w runtime — ISR cache'uje także „sukcesy",
 * więc obcięta sitemapa zapisana po 502 wisiałaby przez cały `revalidate`.
 * Wyjątek: podczas produkcyjnego builda oddajemy to, co zebrane, żeby
 * niedostępny backend nie wywracał deploya (ISR uzupełni resztę).
 */
export async function collectIndexableProducts(): Promise<IndexableProduct[]> {
	const seen = new Set<string>();
	const products: IndexableProduct[] = [];

	try {
		for (let page = 0; page < MAX_PRODUCT_PAGES; page++) {
			const offset = page * PRODUCTS_PAGE_SIZE;
			const { products: batch, count } = await listProductsPage(offset);

			for (const product of batch) {
				if (!product.handle || seen.has(product.handle)) continue;
				seen.add(product.handle);

				// Ten sam parser, którego używa PDP — sitemapa nie może „widzieć"
				// innego SEO niż strona produktu.
				const seo = parseProductSeoFromMetadata(
					product.metadata as Record<string, unknown> | null | undefined,
				);

				// Panel magazynu ma per-produktowy checkbox „nie indeksuj".
				// Zgłoszenie takiego URL-a w sitemapie to błąd w Search Console
				// („Przesłany adres URL oznaczony jako noindex").
				if (seo?.noIndex) continue;

				const url = canonicalUrlFor(product.handle, productTagValues(product), seo?.canonicalUrl);
				if (!url) continue;

				products.push({
					title: product.title ?? product.handle,
					url,
					lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
				});
			}

			const fetched = offset + batch.length;
			if (batch.length === 0 || (typeof count === "number" && fetched >= count)) break;
		}
	} catch (e) {
		if (!isProductionBuild()) throw e;
		console.error("[seo] collectIndexableProducts — Medusa niedostępna podczas builda", e);
	}

	return products;
}

/**
 * Ścieżki listingów podkategorii (`/sklep/gotowe-wzory/<kategoria>`).
 *
 * `/sklep/gotowe-wzory/[slug]` renderuje listing kategorii, a nie produkt, gdy
 * slug jest handle'em bezpośredniego dziecka roota — to pełnoprawne strony
 * z własnym tytułem, opisem i canonicalem, więc należą do sitemapy.
 * Rooty (`certyfikaty`, `gotowe-wzory`, `logo-3d`) `categoryListingHref`
 * mapuje na ich własne trasy — deduplikacja po stronie wywołującego.
 */
export async function collectListingCategoryPaths(): Promise<string[]> {
	const tree = (await getProductCategories().catch((e) => {
		console.error("[seo] collectListingCategoryPaths — brak kategorii", e);
		return [];
	})) as unknown as CategoryTreeNode[];

	const handles = getDirectListingCategoryHandles(tree, LISTING_CATEGORY_HANDLE.gotoweWzory);
	const paths = new Set<string>();

	for (const handle of handles) {
		paths.add(categoryListingHref(handle, "/sklep/gotowe-wzory"));
	}

	return [...paths];
}
