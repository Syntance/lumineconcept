import { describe, expect, it } from "vitest";
import { formatInstagramDisplayLabel, resolveSocialSameAs } from "@/lib/social-links";

describe("social-links", () => {
	it("formatInstagramDisplayLabel extracts handle from profile URL", () => {
		expect(formatInstagramDisplayLabel("https://www.instagram.com/lumine.concept/")).toBe("@lumine.concept");
	});

	it("resolveSocialSameAs returns unique CMS URLs", () => {
		expect(
			resolveSocialSameAs({
				instagram: "https://www.instagram.com/lumine.concept/",
				facebook: "https://www.facebook.com/lumineconcept/",
			}),
		).toEqual([
			"https://www.instagram.com/lumine.concept/",
			"https://www.facebook.com/lumineconcept/",
		]);
	});
});
