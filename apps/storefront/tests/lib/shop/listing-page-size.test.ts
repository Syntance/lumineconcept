import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	LARGEST_CATEGORY_SIZE_AT_REVIEW,
	LISTING_INITIAL_PAGE_SIZE,
} from "@/lib/shop/listing-page-size";

const STOREFRONT_ROOT = path.resolve(__dirname, "../../..");

/**
 * Listingi renderują serwerowo tylko pierwsze `LISTING_INITIAL_PAGE_SIZE`
 * kafelków — i tylko te odnośniki widzi Googlebot. Gdy kategoria jest większa,
 * produkty powyżej progu tracą jedyny link wewnętrzny i lądują w Search Console
 * na „Strona wykryta – obecnie niezindeksowana".
 */
describe("LISTING_INITIAL_PAGE_SIZE — linki do produktów widoczne dla robota", () => {
	it("pokrywa największą kategorię z zapasem na nowe produkty", () => {
		expect(LISTING_INITIAL_PAGE_SIZE).toBeGreaterThanOrEqual(
			LARGEST_CATEGORY_SIZE_AT_REVIEW,
		);
		expect(LISTING_INITIAL_PAGE_SIZE - LARGEST_CATEGORY_SIZE_AT_REVIEW).toBeGreaterThanOrEqual(5);
	});

	it("nie rośnie w nieskończoność — każdy kafelek to zdjęcie w HTML (LCP)", () => {
		expect(LISTING_INITIAL_PAGE_SIZE).toBeLessThanOrEqual(48);
	});

	it.each([
		"components/shop/GotoweWzoryListingPage.tsx",
		"app/(shop)/sklep/certyfikaty/page.tsx",
	])("%s bierze rozmiar ze wspólnej stałej, nie z własnej liczby", (relative) => {
		const source = readFileSync(path.join(STOREFRONT_ROOT, relative), "utf-8");

		expect(source).toContain("LISTING_INITIAL_PAGE_SIZE");
		// Własna liczba w tym miejscu = cicha regresja: jeden listing zostaje
		// przy starym progu i znowu gubi część produktów.
		expect(source).not.toMatch(/const\s+INITIAL_PAGE_SIZE\s*=\s*\d+/);
	});
});
