import { describe, expect, it } from "vitest";

import {
	allocateUniqueProductHandles,
	isDuplicateProductHandle,
	resolveProductHandleForSave,
	slugifyProductTitle,
	stripCopySuffixFromTitle,
} from "@/magazyn/modules/products/product-handle";

describe("stripCopySuffixFromTitle", () => {
	it("usuwa sufiks (kopia) z nazwy", () => {
		expect(stripCopySuffixFromTitle("Tabliczka z kodami QR fala (kopia)")).toBe(
			"Tabliczka z kodami QR fala",
		);
	});
});

describe("slugifyProductTitle", () => {
	it("nie dokleja kopia do slug, gdy tytuł ma sufiks (kopia)", () => {
		expect(slugifyProductTitle("Tabliczka z kodami QR (kopia)")).toBe("tabliczka-z-kodami-qr");
	});

	it("sluguje cudzysłowy i apostrofy w nazwie", () => {
		expect(slugifyProductTitle("Tabliczka z kodami QR 'STONE'")).toBe(
			"tabliczka-z-kodami-qr-stone",
		);
	});
});

describe("resolveProductHandleForSave", () => {
	it("tworzy slug z tytułu dla nowego produktu", () => {
		expect(
			resolveProductHandleForSave({
				title: "Tabliczka QR Premium",
				status: "draft",
			}),
		).toBe("tabliczka-qr-premium");
	});

	it("aktualizuje handle szkicu po zmianie nazwy (kopia)", () => {
		expect(
			resolveProductHandleForSave({
				id: "prod_1",
				title: "Tabliczka QR Premium",
				handle: "tabliczka-qr-kopia",
				status: "draft",
			}),
		).toBe("tabliczka-qr-premium");
	});

	it("aktualizuje handle opublikowanej kopii po zmianie nazwy", () => {
		expect(
			resolveProductHandleForSave({
				id: "prod_1",
				title: "Tabliczka z kodami QR 'STONE'",
				handle: "tabliczka-z-kodami-qr-fala-kopia",
				status: "published",
			}),
		).toBe("tabliczka-z-kodami-qr-stone");
	});

	it("aktualizuje handle opublikowanego produktu po zmianie nazwy", () => {
		expect(
			resolveProductHandleForSave({
				id: "prod_1",
				title: "Nowa nazwa marketingowa",
				handle: "tabliczka-qr-premium",
				status: "published",
			}),
		).toBe("nowa-nazwa-marketingowa");
	});
});

describe("isDuplicateProductHandle", () => {
	it("wykrywa typowe slugi z duplikatu", () => {
		expect(isDuplicateProductHandle("lampa-kopia")).toBe(true);
		expect(isDuplicateProductHandle("produkt-kopia-abc123")).toBe(true);
		expect(isDuplicateProductHandle("tabliczka-z-kodami-qr-fala-kopia")).toBe(true);
		expect(isDuplicateProductHandle("lampa-premium")).toBe(false);
	});
});

describe("allocateUniqueProductHandles", () => {
	it("rozwiązuje kolizje slugów numerem", () => {
		const map = allocateUniqueProductHandles([
			{ id: "a", title: "Tabliczka z kodami QR", handle: "tabliczka-z-kodami-qr", created_at: "2024-01-01" },
			{ id: "b", title: "Tabliczka z kodami QR", handle: "tabliczka-z-kodami-qr-kopia", created_at: "2024-02-01" },
		]);
		expect(map.get("a")).toBe("tabliczka-z-kodami-qr");
		expect(map.get("b")).toBe("tabliczka-z-kodami-qr-2");
	});
});
