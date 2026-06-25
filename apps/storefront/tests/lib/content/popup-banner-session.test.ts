import { afterEach, describe, expect, it } from "vitest";
import {
	hasPopupBannerEntryShown,
	markPopupBannerEntryShown,
	POPUP_BANNER_ENTRY_SESSION_KEY,
	resetPopupBannerEntrySessionForTests,
	resolveInitialPopupBannerView,
} from "@/lib/content/popup-banner-session";

describe("popup-banner-session", () => {
	afterEach(() => {
		resetPopupBannerEntrySessionForTests();
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

	it("keeps entry shown in memory after storage is cleared", () => {
		markPopupBannerEntryShown();
		window.sessionStorage.clear();
		expect(hasPopupBannerEntryShown()).toBe(true);
		expect(resolveInitialPopupBannerView()).toBe("collapsed");
	});

	it("hydrates memory from sessionStorage on cold read", () => {
		window.sessionStorage.setItem(POPUP_BANNER_ENTRY_SESSION_KEY, "1");
		resetPopupBannerEntrySessionForTests();
		window.sessionStorage.setItem(POPUP_BANNER_ENTRY_SESSION_KEY, "1");
		expect(hasPopupBannerEntryShown()).toBe(true);
	});
});
