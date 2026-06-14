import { describe, expect, it } from "vitest";
import {
	getStandEnabledColorNames,
	parseStandAvailable,
	parseStandPaid,
	getStandSurchargeGrosze,
	formatStandSurchargePln,
	parseDisabledConfigIdsBySlotWithStand,
	STAND_COLOR_OPTION_TITLE,
} from "@/lib/products/stand-config";
import { parseMatOverridesBySlotWithStand } from "@/lib/products/color-slot-config";
import { buildStandColorMaps } from "@/lib/products/stand-config";

describe("stand-config", () => {
	it("parseStandAvailable reads metadata flag", () => {
		expect(parseStandAvailable({ stand_available: "true" })).toBe(true);
		expect(parseStandAvailable({ stand_available: "false" })).toBe(false);
		expect(parseStandAvailable(null)).toBe(false);
	});

	it("getStandSurchargeGrosze defaults to free", () => {
		expect(getStandSurchargeGrosze({ stand_available: "true" })).toBe(0);
		expect(getStandSurchargeGrosze({ stand_paid: "false" })).toBe(0);
	});

	it("getStandSurchargeGrosze reads paid price in grosze", () => {
		expect(
			getStandSurchargeGrosze({
				stand_paid: "true",
				stand_surcharge_grosze: "1500",
			}),
		).toBe(1500);
		expect(formatStandSurchargePln(1500)).toBe("15,00");
	});

	it("parseStandPaid reads metadata flag", () => {
		expect(parseStandPaid({ stand_paid: "true" })).toBe(true);
		expect(parseStandPaid({ stand_paid: "false" })).toBe(false);
		expect(parseStandPaid(null)).toBe(false);
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

	it("parseMatOverridesBySlotWithStand keeps separate mat config per mode", () => {
		const slots = ["Kolor tabliczki"] as const;
		const noStand = { "Kolor tabliczki": { g1: false } };
		const withStandMeta = {
			mat_overrides_by_slot_with_stand: JSON.stringify({
				"Kolor tabliczki": { g1: true },
			}),
		};
		expect(
			parseMatOverridesBySlotWithStand(withStandMeta, slots, noStand)["Kolor tabliczki"],
		).toEqual({ g1: true });
		expect(noStand["Kolor tabliczki"]).toEqual({ g1: false });
	});

	it("buildStandColorMaps assigns categoryByColorName for grouping in dropdown", () => {
		const maps = buildStandColorMaps(
			[
				{ id: "g1", name: "czarny", hex_color: "#000", color_category: "standard" },
				{ id: "g2", name: "czerwony", hex_color: "#f00", color_category: "color" },
			],
			[],
			{},
		);
		expect(maps.categoryByColorName.czarny).toBe("standard");
		expect(maps.categoryByColorName.czerwony).toBe("color");
	});
});
