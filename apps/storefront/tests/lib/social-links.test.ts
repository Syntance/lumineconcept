import { describe, expect, it } from "vitest";
import {
	formatFacebookDisplayLabel,
	formatInstagramDisplayLabel,
	normalizeFacebookUrl,
	resolveSocialSameAs,
} from "@/lib/social-links";

const CANONICAL_FACEBOOK =
	"https://www.facebook.com/profile.php?id=100063769314849";

describe("social-links", () => {
	it("normalizeFacebookUrl replaces search links with canonical profile", () => {
		expect(
			normalizeFacebookUrl(
				"https://www.facebook.com/search/top?q=lumine%20concept",
				CANONICAL_FACEBOOK,
			),
		).toBe(CANONICAL_FACEBOOK);
	});

	it("normalizeFacebookUrl keeps profile.php?id links and normalizes host", () => {
		expect(
			normalizeFacebookUrl(
				"https://facebook.com/profile.php?id=100063769314849&ref=foo",
			),
		).toBe(CANONICAL_FACEBOOK);
	});

	it("formatFacebookDisplayLabel shows page name from profile.php URL", () => {
		expect(formatFacebookDisplayLabel(CANONICAL_FACEBOOK)).toBe("Lumine Concept");
	});

	it("formatFacebookDisplayLabel shows readable name from search query", () => {
		expect(
			formatFacebookDisplayLabel("https://www.facebook.com/search/top?q=lumine%20concept"),
		).toBe("Lumine Concept");
	});

	it("formatInstagramDisplayLabel extracts handle from profile URL", () => {
		expect(formatInstagramDisplayLabel("https://www.instagram.com/lumine.concept/")).toBe("@lumine.concept");
	});

	it("resolveSocialSameAs returns unique CMS URLs", () => {
		expect(
			resolveSocialSameAs({
				instagram: "https://www.instagram.com/lumine.concept/",
				facebook: CANONICAL_FACEBOOK,
			}),
		).toEqual([
			"https://www.instagram.com/lumine.concept/",
			CANONICAL_FACEBOOK,
		]);
	});
});
