/** Klucz sessionStorage — jedno rozwinięcie popupu na wejście w witrynę (nowa karta/sesja). */
export const POPUP_BANNER_ENTRY_SESSION_KEY = "lumine_popup_banner_entry_v1";

export function hasPopupBannerEntryShown(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.sessionStorage.getItem(POPUP_BANNER_ENTRY_SESSION_KEY) === "1";
	} catch {
		return false;
	}
}

export function markPopupBannerEntryShown(): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(POPUP_BANNER_ENTRY_SESSION_KEY, "1");
	} catch {
		// Prywatny tryb / zablokowany storage — ignoruj.
	}
}

/** Pierwsze wejście w sesji → otwarty popup; odświeżenie i nawigacja → zwinięty. */
export function resolveInitialPopupBannerView(): "open" | "collapsed" {
	return hasPopupBannerEntryShown() ? "collapsed" : "open";
}
