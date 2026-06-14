import { describe, expect, it } from "vitest";
import {
	getStandEnabledColorNames,
	parseStandAvailable,
	parseDisabledConfigIdsBySlotWithStand,
	STAND_COLOR_OPTION_TITLE,
} from "@/lib/products/stand-config";

describe("stand-config", () => {
	it("parseStandAvailable reads metadata flag", () => {
		expect(parseStandAvailable({ stand_available: "true" })).toBe(true);
		expect(parseStandAvailable({ stand_available: "false" })).toBe(false);
		expect(parseStandAvailable(null)).toBe(false);
	});

	it("parseDisabledConfigIdsBySlotWithStand falls back to no-stand config", () => {
		const slots = ["Kolor tabliczki"] as const;
		const fallback = { "Kolor tabliczki": ["c1"] };
		expect(
			parseDisabledConfigIdsBySlotWithStand({}, slots, fallback)["Kolor tabliczki"],
		).toEqual(["c1"]);
	});

	it("getStandEnabledColorNames respects disabled global colors", () => {
		const names = getStandEnabledColorNames(
			[
				{ id: "g1", name: "Czarny", color_category: "standard" },
				{ id: "g2", name: "Biały", color_category: "standard" },
			],
			[],
			{ stand_disabled_config_ids: JSON.stringify(["g1"]) },
		);
		expect(names).toEqual(["Biały"]);
		expect(STAND_COLOR_OPTION_TITLE).toBe("Podstawka");
	});
});
