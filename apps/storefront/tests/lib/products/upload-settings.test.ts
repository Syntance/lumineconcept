import { describe, expect, it } from "vitest";
import {
	getStorefrontUploadCount,
	isProductUploadComplete,
	parseUploadSettingsFromMetadata,
	serializeUploadSettingsForMetadata,
} from "@/lib/products/upload-settings";

describe("parseUploadSettingsFromMetadata", () => {
	it("returns disabled defaults when metadata empty", () => {
		expect(parseUploadSettingsFromMetadata(null)).toEqual({
			enabled: false,
			required: false,
			count: 5,
			label: "",
		});
	});

	it("treats enabled upload without uploads_required as required (backward compat)", () => {
		expect(
			parseUploadSettingsFromMetadata({
				uploads_enabled: "true",
				uploads_count: "2",
			}),
		).toEqual({
			enabled: true,
			required: true,
			count: 2,
			label: "",
		});
	});

	it("parses optional upload when uploads_required is false", () => {
		expect(
			parseUploadSettingsFromMetadata({
				uploads_enabled: "true",
				uploads_required: "false",
				uploads_count: "3",
				uploads_label: " Twoje grafiki ",
			}),
		).toEqual({
			enabled: true,
			required: false,
			count: 3,
			label: "Twoje grafiki",
		});
	});
});

describe("serializeUploadSettingsForMetadata", () => {
	it("writes uploads_required false for optional enabled upload", () => {
		expect(
			serializeUploadSettingsForMetadata({
				enabled: true,
				required: false,
				count: 1,
				label: "",
			}),
		).toEqual({
			uploads_enabled: "true",
			uploads_required: "false",
			uploads_count: "1",
			uploads_label: "",
		});
	});

	it("clears required flag when upload disabled", () => {
		expect(
			serializeUploadSettingsForMetadata({
				enabled: false,
				required: true,
				count: 2,
				label: "Logo",
			}).uploads_required,
		).toBe("false");
	});
});

describe("isProductUploadComplete", () => {
	it("passes when upload disabled", () => {
		expect(
			isProductUploadComplete(
				{ enabled: false, required: true, count: 1, label: "" },
				0,
			),
		).toBe(true);
	});

	it("passes when upload optional and no files", () => {
		expect(
			isProductUploadComplete(
				{ enabled: true, required: false, count: 1, label: "" },
				0,
			),
		).toBe(true);
	});

	it("fails when upload required and no files", () => {
		expect(
			isProductUploadComplete(
				{ enabled: true, required: true, count: 1, label: "" },
				0,
			),
		).toBe(false);
	});

	it("passes when upload required and at least one file", () => {
		expect(
			isProductUploadComplete(
				{ enabled: true, required: true, count: 1, label: "" },
				1,
			),
		).toBe(true);
	});
});

describe("getStorefrontUploadCount", () => {
	it("returns 0 when disabled", () => {
		expect(
			getStorefrontUploadCount({ enabled: false, required: false, count: 3, label: "" }),
		).toBe(0);
	});

	it("returns count when enabled", () => {
		expect(
			getStorefrontUploadCount({ enabled: true, required: true, count: 3, label: "" }),
		).toBe(3);
	});
});
