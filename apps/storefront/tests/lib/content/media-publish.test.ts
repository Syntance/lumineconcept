import { describe, expect, it } from "vitest";
import { collectMediaUrls, isRemoteCmsMediaUrl, mediaUrlsChanged } from "@/lib/content/media-publish";

describe("isRemoteCmsMediaUrl", () => {
	it("akceptuje zdalny R2/CDN", () => {
		expect(isRemoteCmsMediaUrl("https://cdn.example.com/cms-uploads/hero.webp")).toBe(true);
	});

	it("odrzuca lokalne assety", () => {
		expect(isRemoteCmsMediaUrl("/images/cms/abc.webp")).toBe(false);
		expect(isRemoteCmsMediaUrl("/images/hero.webp")).toBe(false);
	});
});

describe("mediaUrlsChanged", () => {
	it("false gdy zmienia się tylko tekst", () => {
		const before = { hero: { headline: "A", desktopImageUrl: "https://cdn.example/x.webp" } };
		const after = { hero: { headline: "B", desktopImageUrl: "https://cdn.example/x.webp" } };
		expect(mediaUrlsChanged(before, after)).toBe(false);
	});

	it("true gdy zmienia się URL obrazu", () => {
		const before = { hero: { desktopImageUrl: "https://cdn.example/a.webp" } };
		const after = { hero: { desktopImageUrl: "https://cdn.example/b.webp" } };
		expect(mediaUrlsChanged(before, after)).toBe(true);
	});
});

describe("collectMediaUrls", () => {
	it("zbiera zagnieżdżone pola mediów", () => {
		const urls = collectMediaUrls({
			gallery: [{ imageUrl: "https://cdn.example/g.webp" }],
			announcementBar: { text: "Promo" },
		});
		expect([...urls]).toEqual(["https://cdn.example/g.webp"]);
	});
});
