import { describe, expect, it } from "vitest";
import { prepareSectionsForSave, safeParseHistoryJson, safeParseSectionsJson } from "@/lib/composer/sections/parse";
import { createSection } from "@/lib/composer/registry";

describe("prepareSectionsForSave", () => {
	it("odrzuca więcej niż 20 sekcji", () => {
		const sections = Array.from({ length: 21 }, () => createSection("richText"));
		expect(() => prepareSectionsForSave(sections)).toThrow();
	});
});


describe("safeParseSectionsJson", () => {
	it("uszkodzony JSON string → []", () => {
		expect(safeParseSectionsJson("{invalid")).toEqual([]);
	});

	it("poprawny JSON → sekcje", () => {
		const raw = JSON.stringify([
			{
				id: "rt-1",
				type: "richText",
				props: { bodyHtml: "<p>ok</p>" },
			},
		]);
		const parsed = safeParseSectionsJson(raw);
		expect(parsed).toHaveLength(1);
		expect(parsed[0]?.type).toBe("richText");
	});
});

describe("safeParseHistoryJson", () => {
	it("uszkodzony JSON → pusta historia", () => {
		expect(safeParseHistoryJson("not-json")).toEqual({ versions: [] });
	});
});
