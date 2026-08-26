import { describe, expect, it } from "vitest";
import { toMetaDescription } from "@/lib/seo/meta-description";

describe("toMetaDescription", () => {
	it("usuwa znaczniki HTML z opisu produktu", () => {
		const html = "<p>Cennik z <strong>plexi</strong></p><p>Grubość 3&nbsp;mm.</p>";

		const result = toMetaDescription(html);

		expect(result).not.toMatch(/[<>]/);
		expect(result).toBe("Cennik z plexi Grubość 3 mm.");
	});

	it("przycina do długości snippetu na granicy słowa", () => {
		const sentence = "Tabliczka z plexi dla salonu beauty. ";
		const plain = sentence.repeat(20).trim();

		const result = toMetaDescription(`<p>${sentence.repeat(20)}</p>`);

		expect(result).toBeDefined();
		expect(result!.length).toBeLessThanOrEqual(161);
		expect(result!.endsWith("…")).toBe(true);

		// Bez ucinania w połowie wyrazu: treść bez wielokropka to prefiks
		// oryginału, a zaraz za nim w oryginale stoi spacja.
		const body = result!.slice(0, -1);
		expect(plain.startsWith(body)).toBe(true);
		expect(plain[body.length]).toBe(" ");
	});

	it("zostawia krótki opis bez zmian i bez wielokropka", () => {
		const result = toMetaDescription("Krótki opis produktu.");

		expect(result).toBe("Krótki opis produktu.");
	});

	it("zwraca undefined dla pustego wejścia i samego HTML-a", () => {
		expect(toMetaDescription(undefined)).toBeUndefined();
		expect(toMetaDescription(null)).toBeUndefined();
		expect(toMetaDescription("")).toBeUndefined();
		expect(toMetaDescription("<p></p><br/>")).toBeUndefined();
	});

	it("przycina twardo, gdy nie ma na czym złamać", () => {
		const result = toMetaDescription("a".repeat(300));

		expect(result).toBe(`${"a".repeat(160)}…`);
	});
});
