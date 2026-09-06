import { describe, expect, it } from "vitest";
import { buildMetadata } from "@/lib/content/metadata";

const SITE = "http://localhost:3000";

describe("buildMetadata — tytuł a szablon root layoutu", () => {
	it("tytuł bez nazwy sklepu zostawia do szablonu `%s | Lumine Concept`", () => {
		const meta = buildMetadata({ fallbackTitle: "Cennik klasyczny", path: "/x" });
		expect(meta.title).toBe("Cennik klasyczny");
	});

	it("meta title z panelu zawierający nazwę sklepu idzie jako absolute (bez dublowania sufiksu)", () => {
		const meta = buildMetadata({
			seo: { metaTitle: "Tabliczka z kodami QR STONE z plexi | Lumine Concept" },
			fallbackTitle: "Tabliczka z kodami QR",
			path: "/sklep/gotowe-wzory/tabliczka-z-kodami-qr",
		});
		expect(meta.title).toEqual({
			absolute: "Tabliczka z kodami QR STONE z plexi | Lumine Concept",
		});
	});

	it("porównuje nazwę sklepu bez rozróżniania wielkości liter", () => {
		const meta = buildMetadata({ fallbackTitle: "O nas — LUMINE CONCEPT", path: "/o-nas" });
		expect(meta.title).toEqual({ absolute: "O nas — LUMINE CONCEPT" });
	});

	it("nazwę sklepu bierze z ustawień strony, gdy są dostępne", () => {
		const meta = buildMetadata({
			fallbackTitle: "Kontakt | Sklep Testowy",
			siteSettings: { title: "Sklep Testowy", description: "" },
			path: "/kontakt",
		});
		expect(meta.title).toEqual({ absolute: "Kontakt | Sklep Testowy" });
		expect(meta.openGraph?.siteName).toBe("Sklep Testowy");
	});

	it("canonical i og:url wskazują tę samą ścieżkę na SITE_URL", () => {
		const meta = buildMetadata({ fallbackTitle: "X", path: "/sklep" });
		expect(meta.alternates?.canonical).toBe(`${SITE}/sklep`);
		expect(meta.openGraph?.url).toBe(`${SITE}/sklep`);
	});
});
