import { getSiteSettings } from "@/lib/content";
import {
	collectIndexableProducts,
	collectListingCategoryPaths,
} from "@/lib/seo/indexable-urls";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 3600;

const STATIC_PAGES = [
	{ label: "Strona główna", path: "/" },
	{ label: "Sklep", path: "/sklep" },
	{ label: "Gotowe wzory", path: "/sklep/gotowe-wzory" },
	{ label: "Tablice z logo", path: "/sklep/tablice-z-logo" },
	{ label: "Certyfikaty", path: "/sklep/certyfikaty" },
	{ label: "O nas", path: "/o-nas" },
	{ label: "Kontakt", path: "/kontakt" },
	{ label: "Dostawa i płatności", path: "/dostawa-i-platnosci" },
	{ label: "Zwroty", path: "/zwroty" },
] as const;

function siteOrigin(): string {
	return SITE_URL.trim().replace(/\/$/, "");
}

export async function GET() {
	const origin = siteOrigin();

	const [settings, products, listingPaths] = await Promise.all([
		getSiteSettings(),
		collectIndexableProducts(),
		collectListingCategoryPaths(),
	]);

	const description =
		settings?.description ??
		"Produkty z plexi i rozwiązania brandingowe dla salonów beauty.";

	const sections = [
		"# Lumine Concept",
		`> ${description}`,
		"",
		"## Strony",
		...STATIC_PAGES.map(({ label, path }) => `- [${label}](${origin}${path})`),
	];

	if (listingPaths.length > 0) {
		sections.push(
			"",
			"## Kategorie",
			...listingPaths.map((path) => {
				const handle = path.split("/").pop() ?? path;
				return `- [${handle}](${origin}${path})`;
			}),
		);
	}

	if (products.length > 0) {
		sections.push(
			"",
			"## Produkty",
			...products.map(({ title, url }) => `- [${title}](${url})`),
		);
	}

	sections.push("", `Sitemap: ${origin}/sitemap.xml`);

	return new Response(sections.join("\n"), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
