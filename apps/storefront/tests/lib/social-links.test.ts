import { describe, expect, it } from "vitest";
import {
	formatFacebookDisplayLabel,
	formatInstagramDisplayLabel,
	resolveSocialSameAs,
} from "@/lib/social-links";

describe("social-links", () => {
	it("formatFacebookDisplayLabel extracts page slug from profile URL", () => {
		expect(formatFacebookDisplayLabel("https://www.facebook.com/lumineconcept/")).toBe("lumineconcept");
	});

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
