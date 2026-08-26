import { beforeEach, describe, expect, it, vi } from "vitest";

const productList = vi.fn();
const getProductCategories = vi.fn();

vi.mock("@/lib/medusa/client", () => ({
	medusa: { store: { product: { list: (...args: unknown[]) => productList(...args) } } },
}));

vi.mock("@/lib/medusa/products", () => ({
	getProductCategories: () => getProductCategories(),
}));

import {
	collectIndexableProducts,
	collectListingCategoryPaths,
} from "@/lib/seo/indexable-urls";

const CERT = {
	handle: "dyplom-premium",
	title: "Dyplom premium",
	updated_at: "2026-01-02T00:00:00.000Z",
	tags: [{ value: "certyfikat" }],
};
const LOGO = {
	handle: "tablica-logo-led",
	title: "Tablica z logo LED",
	updated_at: "2026-01-03T00:00:00.000Z",
	tags: [{ value: "logo-3d" }],
};
const PLAIN = {
	handle: "cennik-a4",
	title: "Cennik A4",
	updated_at: "2026-01-04T00:00:00.000Z",
	tags: [],
};

describe("collectIndexableProducts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("prosi Medusę o relację tags — bez niej każdy produkt trafia pod gotowe-wzory", async () => {
		productList.mockResolvedValue({ products: [], count: 0 });

		await collectIndexableProducts();

		expect(productList).toHaveBeenCalledWith(
			expect.objectContaining({ fields: expect.stringContaining("+tags") }),
		);
	});

	it("mapuje produkt na jego kanoniczną ścieżkę wg tagów", async () => {
		productList.mockResolvedValue({ products: [CERT, LOGO, PLAIN], count: 3 });

		const products = await collectIndexableProducts();

		expect(products.map((p) => p.path)).toEqual([
			"/sklep/certyfikaty/dyplom-premium",
			"/sklep/tablice-z-logo/tablica-logo-led",
			"/sklep/gotowe-wzory/cennik-a4",
		]);
	});

	it("paginuje i odfiltrowuje duplikaty handle", async () => {
		productList
			.mockResolvedValueOnce({ products: [CERT, PLAIN], count: 3 })
			.mockResolvedValueOnce({ products: [PLAIN, LOGO], count: 3 });

		const products = await collectIndexableProducts();

		expect(products).toHaveLength(3);
		expect(new Set(products.map((p) => p.path)).size).toBe(3);
	});

	it("ponawia błędy przejściowe (cold start Railway), potem rzuca", async () => {
		vi.useFakeTimers();
		productList.mockRejectedValue(new Error("502 Bad Gateway"));

		// Rzut zamiast pustej listy — ISR cache'uje też „sukcesy", więc obcięta
		// sitemapa zapisana po 502 wisiałaby przez cały `revalidate`.
		const assertion = expect(collectIndexableProducts()).rejects.toThrow();
		await vi.runAllTimersAsync();
		await assertion;

		expect(productList).toHaveBeenCalledTimes(4);
		vi.useRealTimers();
	});

	it("podczas produkcyjnego builda nie wywraca deployu", async () => {
		vi.useFakeTimers();
		vi.stubEnv("NEXT_PHASE", "phase-production-build");
		productList.mockRejectedValue(new Error("502 Bad Gateway"));

		const promise = collectIndexableProducts();
		await vi.runAllTimersAsync();

		await expect(promise).resolves.toEqual([]);
		vi.unstubAllEnvs();
		vi.useRealTimers();
	});
});

describe("collectListingCategoryPaths", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("zwraca listingi podkategorii gotowych wzorów", async () => {
		getProductCategories.mockResolvedValue([
			{
				id: "root",
				handle: "gotowe-wzory",
				name: "Gotowe wzory",
				category_children: [
					{ id: "c1", handle: "cenniki", name: "Cenniki" },
					{ id: "c2", handle: "tabliczki", name: "Tabliczki" },
					{ id: "c3", handle: "ukryta", name: "Ukryta", is_active: false },
				],
			},
		]);

		const paths = await collectListingCategoryPaths();

		expect(paths).toContain("/sklep/gotowe-wzory/cenniki");
		expect(paths).toContain("/sklep/gotowe-wzory/tabliczki");
		expect(paths).not.toContain("/sklep/gotowe-wzory/ukryta");
	});

	it("nie wywraca się, gdy kategorie są niedostępne", async () => {
		getProductCategories.mockRejectedValue(new Error("offline"));

		await expect(collectListingCategoryPaths()).resolves.toEqual([]);
	});
});
