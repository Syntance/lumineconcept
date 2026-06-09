import { describe, expect, it } from "vitest";
import {
	CUSTOM_COLOR_CATEGORY_ID,
	isColorCategoryEnabledForSlot,
	parseAllowCustomColorBySlot,
	parseDisabledColorCategoriesBySlot,
	resolveAllowCustomColorForSlot,
} from "@/lib/products/color-slot-config";

const slotTitles = ["Kolor tabliczki"] as const;

describe("parseDisabledColorCategoriesBySlot", () => {
	it("mapuje wyłączoną kategorię po indeksie gdy klucz slotu się zmienił", () => {
		const result = parseDisabledColorCategoriesBySlot(
			{
				disabled_color_categories_by_slot: JSON.stringify({
					"Stary klucz": [CUSTOM_COLOR_CATEGORY_ID],
				}),
			},
			slotTitles,
		);

		expect(result["Kolor tabliczki"]).toEqual([CUSTOM_COLOR_CATEGORY_ID]);
	});
});

describe("resolveAllowCustomColorForSlot", () => {
	it("blokuje HEX gdy kategoria Indywidualny jest wyłączona", () => {
		const disabled = parseDisabledColorCategoriesBySlot(
			{
				disabled_color_categories_by_slot: JSON.stringify({
					"Kolor tabliczki": [CUSTOM_COLOR_CATEGORY_ID],
				}),
			},
			slotTitles,
		);

		expect(
			resolveAllowCustomColorForSlot(
				{ "Kolor tabliczki": true },
				"Kolor tabliczki",
				true,
				disabled,
			),
		).toBe(false);
	});

	it("respektuje wyłączenie HEX gdy kategoria włączona", () => {
		expect(
			resolveAllowCustomColorForSlot(
				{ "Kolor tabliczki": false },
				"Kolor tabliczki",
				true,
				{ "Kolor tabliczki": [] },
			),
		).toBe(false);
	});

	it("pozwala na HEX gdy kategoria włączona i flaga włączona", () => {
		expect(
			resolveAllowCustomColorForSlot(
				{ "Kolor tabliczki": true },
				"Kolor tabliczki",
				true,
				{ "Kolor tabliczki": [] },
			),
		).toBe(true);
	});
});

describe("parseAllowCustomColorBySlot", () => {
	it("czyta wartość po indeksie metadata gdy brak dokładnego klucza", () => {
		const result = parseAllowCustomColorBySlot(
			{
				allow_custom_color_by_slot: JSON.stringify({
					"Stary klucz": "false",
				}),
			},
			slotTitles,
			true,
		);

		expect(result["Kolor tabliczki"]).toBe(false);
	});
});

describe("isColorCategoryEnabledForSlot", () => {
	it("zwraca false gdy custom jest na liście wyłączonych", () => {
		expect(
			isColorCategoryEnabledForSlot(
				{ "Kolor tabliczki": [CUSTOM_COLOR_CATEGORY_ID] },
				"Kolor tabliczki",
			),
		).toBe(false);
	});
});
