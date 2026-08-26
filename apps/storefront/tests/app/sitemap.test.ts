import { beforeEach, describe, expect, it, vi } from "vitest";

const collectIndexableProducts = vi.fn();
const collectListingCategoryPaths = vi.fn();

vi.mock("@/lib/seo/indexable-urls", () => ({
	collectIndexableProducts: () => collectIndexableProducts(),
	collectListingCategoryPaths: () => collectListingCategoryPaths(),
}));

import sitemap from "@/app/sitemap";

const SITE = "http://localhost:3000";

describe("sitemap.xml", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		collectIndexableProducts.mockResolvedValue([]);
		collectListingCategoryPaths.mockResolvedValue([]);
	});

	it("zawiera wszystkie indeksowalne podstrony statyczne", async () => {
		const urls = (await sitemap()).map((e) => e.url);

		for (const path of [
			"",
			"/sklep",
			"/sklep/gotowe-wzory",
			"/sklep/tablice-z-logo",
			"/sklep/certyfikaty",
			"/o-nas",
			"/kontakt",
			"/dostawa-i-platnosci",
			"/zwroty",
			"/regulamin",
			"/polityka-prywatnosci",
			"/deklaracja-dostepnosci",
		]) {
			expect(urls).toContain(`${SITE}${path}`);
		}
	});

	it("pomija strony noindex i przekierowania", async () => {
		const urls = (await sitemap()).map((e) => e.url);

		// `salony-beauty` = noindex (w budowie), `pakiety` = permanentRedirect,
		// koszyk/checkout = noindex + disallow w robots.txt.
		for (const path of ["/salony-beauty", "/sklep/pakiety", "/koszyk", "/checkout"]) {
			expect(urls).not.toContain(`${SITE}${path}`);
		}
	});

	it("dodaje produkty pod ich kanonicznymi adresami", async () => {
		collectIndexableProducts.mockResolvedValue([
			{
				title: "Dyplom",
				path: "/sklep/certyfikaty/dyplom",
				lastModified: new Date("2026-02-01T00:00:00.000Z"),
			},
		]);

		const urls = (await sitemap()).map((e) => e.url);

		expect(urls).toContain(`${SITE}/sklep/certyfikaty/dyplom`);
		expect(urls).not.toContain(`${SITE}/sklep/gotowe-wzory/dyplom`);
	});

	it("dodaje listingi podkategorii i nie duplikuje rootów", async () => {
		collectListingCategoryPaths.mockResolvedValue([
			"/sklep/gotowe-wzory/cenniki",
			"/sklep/certyfikaty",
		]);

		const urls = (await sitemap()).map((e) => e.url);

		expect(urls).toContain(`${SITE}/sklep/gotowe-wzory/cenniki`);
		expect(urls.filter((u) => u === `${SITE}/sklep/certyfikaty`)).toHaveLength(1);
	});

	it("nie zwraca zduplikowanych URL-i", async () => {
		collectIndexableProducts.mockResolvedValue([
			{ title: "A", path: "/sklep/gotowe-wzory/a", lastModified: new Date() },
			{ title: "A", path: "/sklep/gotowe-wzory/a", lastModified: new Date() },
		]);

		const urls = (await sitemap()).map((e) => e.url);

		expect(new Set(urls).size).toBe(urls.length);
	});
});
