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
): Promise<{ "data-cms"?: string }> {
  const { isEnabled } = await draftMode();
  return isEnabled ? { "data-cms": field } : {};
}
