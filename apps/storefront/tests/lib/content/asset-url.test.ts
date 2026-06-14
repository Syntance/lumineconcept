import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveMedusaMediaUrl } from "@magazyn/core/medusa/media-url";
import {
	isCmsImageUnoptimized,
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
		expect(resolveCmsAssetUrl("/static/x.webp")).toBeUndefined();
	});

	it("blokuje zdalne uploady CMS poza /images/cms/", () => {
		expect(resolveCmsAssetUrl("https://pub-abc.r2.dev/cms-uploads/x.webp")).toBeUndefined();
		expect(resolveCmsAssetUrl("/images/cms/x.webp")).toBe("/images/cms/x.webp");
	});

	it("optymalizuje zdalne obrazy R2/CDN przez next/image", () => {
		expect(isCmsImageUnoptimized("https://cdn.example.com/cms-uploads/hero.webp")).toBe(false);
		expect(isCmsImageUnoptimized("https://pub-abc.r2.dev/cms-uploads/x.webp")).toBe(false);
	});

	it("pomija optymalizację dla SVG i hostów lokalnych", () => {
		expect(isCmsImageUnoptimized("https://cdn.example.com/logo.svg")).toBe(true);
		expect(isCmsImageUnoptimized("http://localhost:9000/static/hero.webp")).toBe(true);
		expect(isCmsImageUnoptimized("http://127.0.0.1:9000/static/hero.webp")).toBe(true);
	});

	it("optymalizuje lokalne assety z /public (poza SVG)", () => {
		expect(isCmsImageUnoptimized("/images/hero.webp")).toBe(false);
		expect(isCmsImageUnoptimized("/icons/logo.svg")).toBe(true);
	});

	it("pomija optymalizację dla ścieżek backendu bez pliku w public", () => {
		expect(isCmsImageUnoptimized("/static/hero.webp")).toBe(true);
		expect(isCmsImageUnoptimized("/uploads/x.webp")).toBe(true);
	});
});
