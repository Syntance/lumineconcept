import { describe, expect, it } from "vitest";
import { applyMediaUrlOverlay, normalizeMetadataBlobForOverlay } from "@/lib/content/media-overlay";
import { parsePageContentMap } from "@/lib/content/parsers";

const remoteA = "https://cdn.example.com/cms/a.webp";
const remoteB = "https://cdn.example.com/cms/b.webp";
const localA = "/images/cms/a.webp";

const emptySections = {
	pageSectionsLive: {},
	pageSectionsDraft: {},
	pageSectionsHistory: {},
} as const;

describe("applyMediaUrlOverlay", () => {
	it("mapuje znane URL-e na lokalne ścieżki", () => {
		const out = applyMediaUrlOverlay(
			{
				siteSettings: null,
				pageSeo: null,
				pageContent: {
					"logo-3d": {
						gallery: [{ id: "1", imageUrl: remoteA, order: 0 }],
					},
				},
				globalContent: null,
				themeTokens: null,
				...emptySections,
			},
			{ [remoteA]: localA },
		);

		const gallery = (out.pageContent as Record<string, { gallery?: Array<{ imageUrl: string }> }>)["logo-3d"]
			?.gallery;
		expect(gallery?.[0]?.imageUrl).toBe(localA);
	});

	it("ukrywa nowe zdalne obrazy bez wpisu w mapie (do redeploy)", () => {
		const out = applyMediaUrlOverlay(
			{
				siteSettings: null,
				pageSeo: null,
				pageContent: {
					"logo-3d": {
						gallery: [
							{ id: "1", imageUrl: remoteA, order: 0 },
							{ id: "2", imageUrl: remoteB, order: 1 },
						],
					},
				},
				globalContent: null,
				themeTokens: null,
				...emptySections,
			},
			{ [remoteA]: localA },
		);

		const gallery = (out.pageContent as Record<string, { gallery?: Array<{ id: string }> }>)["logo-3d"]?.gallery;
		expect(gallery).toHaveLength(1);
		expect(gallery?.[0]?.id).toBe("1");
	});

	it("bez mapy prebuild ukrywa zdalne URL-e (localhost = prod)", () => {
		const out = applyMediaUrlOverlay(
			{
				siteSettings: null,
				pageSeo: null,
				pageContent: {
					"logo-3d": {
						gallery: [{ id: "1", imageUrl: remoteB, order: 0 }],
					},
				},
				globalContent: null,
				themeTokens: null,
				...emptySections,
			},
			{},
		);

		const gallery = (out.pageContent as Record<string, { gallery?: Array<{ id: string }> }>)["logo-3d"]
			?.gallery;
		expect(gallery).toHaveLength(0);
	});

	it("mapuje galerię gdy pageContent jest JSON-stringiem z Medusy", () => {
		const rawBlob = {
			siteSettings: null,
			pageSeo: null,
			pageContent: JSON.stringify({
				"logo-3d": {
					gallery: [{ id: "1", imageUrl: remoteA, order: 0 }],
				},
			}),
			globalContent: null,
			themeTokens: null,
			...emptySections,
		};

		const out = applyMediaUrlOverlay(normalizeMetadataBlobForOverlay(rawBlob), {
			[remoteA]: localA,
		});
		const map = parsePageContentMap(out.pageContent);
		expect(map["logo-3d"]?.gallery?.[0]?.imageUrl).toBe(localA);
	});
});
