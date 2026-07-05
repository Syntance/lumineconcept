import { getSiteSettings } from "@/lib/content";
import { medusa } from "@/lib/medusa/client";
import { canonicalProductPath, productTagValues } from "@/lib/products/product-canonical";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

const PRODUCTS_PAGE_SIZE = 200;
const MAX_PRODUCT_PAGES = 100;

const STATIC_PAGES = [
	{ label: "Strona główna", path: "/" },
	{ label: "Sklep", path: "/sklep" },
	{ label: "Gotowe wzory", path: "/sklep/gotowe-wzory" },
	{ label: "Tablice z logo", path: "/sklep/tablice-z-logo" },
	{ label: "Certyfikaty", path: "/sklep/certyfikaty" },
	{ label: "Kontakt", path: "/kontakt" },
	{ label: "Dostawa i płatności", path: "/dostawa-i-platnosci" },
] as const;

function siteOrigin(): string {
	return SITE_URL.trim().replace(/\/$/, "");
}

async function collectProductLines(): Promise<string[]> {
	const origin = siteOrigin();
	const seen = new Set<string>();
	const lines: string[] = [];

	try {
		for (let page = 0; page < MAX_PRODUCT_PAGES; page++) {
			const offset = page * PRODUCTS_PAGE_SIZE;
			const { products, count } = await medusa.store.product.list({
				limit: PRODUCTS_PAGE_SIZE,
				offset,
			});

			for (const product of products) {
				if (!product.handle || seen.has(product.handle)) continue;
				seen.add(product.handle);

				const path = canonicalProductPath(product.handle, productTagValues(product));
				lines.push(`- [${product.title}](${origin}${path})`);
			}

			const fetched = offset + products.length;
			if (products.length === 0 || (typeof count === "number" && fetched >= count)) {
				break;
			}
		}
	} catch {
		// Medusa niedostępna — zwracamy statyczne strony bez listy produktów.
	}

	return lines;
}

export async function GET() {
	const origin = siteOrigin();
	const settings = await getSiteSettings();
	const description =
		settings?.description ??
		"Produkty z plexi i rozwiązania brandingowe dla salonów beauty.";

	const productLines = await collectProductLines();

	const sections = [
		"# Lumine Concept",
		`> ${description}`,
		"",
		"## Strony",
		...STATIC_PAGES.map(({ label, path }) => `- [${label}](${origin}${path})`),
	];

	if (productLines.length > 0) {
		sections.push("", "## Produkty", ...productLines);
	}

	sections.push("", `Sitemap: ${origin}/sitemap.xml`);

	return new Response(sections.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
