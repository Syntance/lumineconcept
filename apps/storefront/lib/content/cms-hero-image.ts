/** Proporcje pasma hero na mobile (`MobileHeroImageBand`). */
export const MOBILE_HERO_BAND_WIDTH = 1080;
export const MOBILE_HERO_BAND_HEIGHT = 1350;

/** Jakość hero HP — spójna z WebP q92 po sync CMS i `next.config` `qualities`. */
export const HERO_IMAGE_QUALITY = 92;

/** Jakość AVIF hero generowanego w prebuild — ~50% mniej bajtów niż WebP q92 przy zbliżonej percepcji wizualnej. */
export const CMS_HERO_AVIF_QUALITY = 70;

/**
 * Zwraca ścieżkę statycznego pliku AVIF dla lokalnego hero WebP z `/images/cms/`.
 * Plik jest generowany przez `sync-cms-to-static` podczas prebuild dla URL-ów hero (mobile + desktop).
 * Dla innych ścieżek (remote URL, nie-.webp, poza `/images/cms/`) zwraca null.
 */
export function toHeroAvifSrc(webpSrc: string): string | null {
	if (!webpSrc.startsWith("/images/cms/") || !webpSrc.endsWith(".webp")) return null;
	return webpSrc.slice(0, -5) + ".avif";
}

/**
 * Max dłuższy bok mobilnego hero po sync/build.
 * Serwowane `unoptimized` (statyczny WebP), więc to JEST faktyczny rozmiar pliku
 * na mobile. 1280 px to wciąż ~3× wyświetlany ~390 px (ostre na DPR3), ale o ~30%
 * mniej bajtów niż 1536 → szybszy LCP pod throttlingiem 4G. Quality (q92) bez zmian.
 */
export const MOBILE_HERO_MAX_LONG_EDGE = 1280;

/** Max dłuższy bok desktop hero po sync — pełna szerokość layoutu (2560). */
export const DESKTOP_HERO_MAX_LONG_EDGE = 2560;

export const DESKTOP_HERO_WIDTH = 2560;
export const DESKTOP_HERO_HEIGHT = 966;

/**
 * Limit dłuższego boku dla zwykłych obrazów CMS (Instagram, galeria, tła sekcji).
 * Pliki powyżej tego limitu wychodziły po sync jako 1–2 MB mimo WebP q92 (oryginały
 * z aparatu ~4000 px). Na żadnym wyświetlaczu różnica 1920 px vs 4000 px nie jest
 * widoczna przy elementach <50 vw. Bez straty jakości q92.
 */
export const CMS_IMAGE_MAX_LONG_EDGE = 1920;
