/** Klucz sessionStorage — jedno rozwinięcie popupu na wejście w witrynę (nowa karta/sesja). */
export const POPUP_BANNER_ENTRY_SESSION_KEY = "lumine_popup_banner_entry_v1";

/** Pamięć w procesie — przetrwa remount komponentu przy nawigacji SPA. */
let entryShownInTab = false;

function readEntryShownFromStorage(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.sessionStorage.getItem(POPUP_BANNER_ENTRY_SESSION_KEY) === "1";
	} catch {
		return false;
	}
}

function hydrateEntryShownFromStorage(): void {
	entryShownInTab = readEntryShownFromStorage();
}

if (typeof window !== "undefined") {
	hydrateEntryShownFromStorage();
}

export function hasPopupBannerEntryShown(): boolean {
	if (entryShownInTab) return true;
	hydrateEntryShownFromStorage();
	return entryShownInTab;
}

export function markPopupBannerEntryShown(): void {
	entryShownInTab = true;
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(POPUP_BANNER_ENTRY_SESSION_KEY, "1");
	} catch {
		// Prywatny tryb / zablokowany storage — zostaje flaga w pamięci procesu.
	}
}

/** Pierwsze wejście w sesji → otwarty popup; odświeżenie i nawigacja → zwinięty. */
export function resolveInitialPopupBannerView(): "open" | "collapsed" {
	return hasPopupBannerEntryShown() ? "collapsed" : "open";
}

/** Tylko testy — reset stanu modułu między przypadkami. */
export function resetPopupBannerEntrySessionForTests(): void {
	entryShownInTab = false;
	if (typeof window !== "undefined") {
		try {
			window.sessionStorage.removeItem(POPUP_BANNER_ENTRY_SESSION_KEY);
		} catch {
			// ignore
		}
	}
}
