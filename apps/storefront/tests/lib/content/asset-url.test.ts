import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveMedusaMediaUrl } from "@magazyn/core/medusa/media-url";
import {
	isStorefrontPublicAssetPath,
	resolveCmsAssetUrl,
} from "@/lib/content/asset-url";

describe("resolveMedusaMediaUrl", () => {
	const env = process.env;

	beforeEach(() => {
		process.env = { ...env };
		process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = "https://api.example.com";
		process.env.S3_FILE_URL = "https://cdn.example.com";
	});

	afterEach(() => {
		process.env = env;
	});

	it("rewrites /static/ path to CDN", () => {
		expect(resolveMedusaMediaUrl("/static/hero.webp")).toBe(
			"https://cdn.example.com/static/hero.webp",
		);
	});

	it("rewrites backend absolute URL to CDN", () => {
		expect(resolveMedusaMediaUrl("https://api.example.com/static/hero.webp")).toBe(
			"https://cdn.example.com/static/hero.webp",
		);
	});

	it("rewrites localhost medusa URL to prod CDN", () => {
		expect(resolveMedusaMediaUrl("http://localhost:9000/static/hero.webp")).toBe(
			"https://cdn.example.com/static/hero.webp",
		);
	});

	it("passes through external CDN URLs unchanged", () => {
		expect(resolveMedusaMediaUrl("https://cdn.example.com/static/x.webp")).toBe(
			"https://cdn.example.com/static/x.webp",
		);
	});
});

describe("resolveCmsAssetUrl", () => {
	const env = process.env;

	beforeEach(() => {
		process.env = { ...env };
		process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = "https://api.example.com";
		process.env.S3_FILE_URL = "https://cdn.example.com";
	});

	afterEach(() => {
		process.env = env;
	});

	it("keeps storefront public assets local", () => {
		expect(resolveCmsAssetUrl("/images/hero.webp")).toBe("/images/hero.webp");
		expect(isStorefrontPublicAssetPath("/images/hero.webp")).toBe(true);
	});

	it("does not treat /static as storefront public", () => {
		expect(isStorefrontPublicAssetPath("/static/x.webp")).toBe(false);
		expect(resolveCmsAssetUrl("/static/x.webp")).toBe("https://cdn.example.com/static/x.webp");
	});
});
