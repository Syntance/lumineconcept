import { describe, expect, it } from "vitest";
import { safeParseHistoryJson, safeParseSectionsJson } from "@/lib/composer/sections/parse";

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
