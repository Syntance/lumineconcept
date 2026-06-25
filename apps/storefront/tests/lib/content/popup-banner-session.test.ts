import { afterEach, describe, expect, it } from "vitest";
import {
	hasPopupBannerEntryShown,
	markPopupBannerEntryShown,
	POPUP_BANNER_ENTRY_SESSION_KEY,
	resolveInitialPopupBannerView,
} from "@/lib/content/popup-banner-session";

describe("popup-banner-session", () => {
	afterEach(() => {
		window.sessionStorage.clear();
	});

	it("starts as not shown in a fresh session", () => {
		expect(hasPopupBannerEntryShown()).toBe(false);
		expect(resolveInitialPopupBannerView()).toBe("open");
	});

	it("marks entry as shown for the rest of the session", () => {
		markPopupBannerEntryShown();
		expect(window.sessionStorage.getItem(POPUP_BANNER_ENTRY_SESSION_KEY)).toBe("1");
		expect(hasPopupBannerEntryShown()).toBe(true);
		expect(resolveInitialPopupBannerView()).toBe("collapsed");
	});
});
