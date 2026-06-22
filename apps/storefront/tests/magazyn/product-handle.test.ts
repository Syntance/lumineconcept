import { describe, expect, it } from "vitest";

import {
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

	it("ignoruje (kopia) w tytule przy liczeniu nowego slug", () => {
		expect(
			resolveProductHandleForSave({
				id: "prod_1",
				title: "Tabliczka z kodami QR (kopia)",
				handle: "tabliczka-z-kodami-qr-fala-kopia",
				status: "published",
			}),
		).toBe("tabliczka-z-kodami-qr");
	});

	it("nie zmienia handle opublikowanego produktu bez „kopia” w slug", () => {
		expect(
			resolveProductHandleForSave({
				id: "prod_1",
				title: "Nowa nazwa marketingowa",
				handle: "tabliczka-qr-premium",
				status: "published",
			}),
		).toBe("tabliczka-qr-premium");
	});

	it("synchronizuje handle opublikowanej kopii, dopóki slug zawiera kopia", () => {
		expect(
			resolveProductHandleForSave({
				id: "prod_1",
				title: "Tabliczka QR Premium",
				handle: "tabliczka-qr-kopia",
				status: "published",
			}),
		).toBe("tabliczka-qr-premium");
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
