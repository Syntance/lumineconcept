import "server-only";
import { draftMode } from "next/headers";

/**
 * Adnotacje elementów dla trybu „edycji na żywo" CMS (ADR: podgląd w iframie
 * panelu magazynu). W normalnym renderze zwraca {} — HTML produkcyjny nie
 * zawiera ANI JEDNEGO bajta edytorskiego. Atrybut `data-cms` pojawia się
 * wyłącznie przy włączonym `draftMode()` (bramkowane sesją admina przez
 * /api/cms-preview/enable).
 *
 * Konwencja ścieżek — spójna z kluczami edytorów magazynu:
 *   page.<pageId>.<block>[.<pole>]   np. page.home.hero, page.o-nas.hero.headline
 *   global.<sekcja>[.<pole>]         np. global.trustBar.followers
 *   settings.<sekcja>[.<pole>]       np. settings.announcementBar.text
 */
export async function cmsAttr(
	field: string,
	options?: { inline?: "text" | "image" },
): Promise<{ "data-cms"?: string; "data-cms-inline"?: string }> {
	const { isEnabled } = await draftMode();
	if (!isEnabled) return {};
	const attrs: { "data-cms": string; "data-cms-inline"?: string } = {
		"data-cms": field,
	};
	if (options?.inline) attrs["data-cms-inline"] = options.inline;
	return attrs;
}
