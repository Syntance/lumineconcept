/** Proporcje pasma hero na mobile (`MobileHeroImageBand`). */
export const MOBILE_HERO_BAND_WIDTH = 1080;
export const MOBILE_HERO_BAND_HEIGHT = 1350;

/**
 * Max dłuższy bok mobilnego hero po sync/build.
 * Serwowane `unoptimized` (statyczny WebP), więc to JEST faktyczny rozmiar pliku
 * na mobile. 1280 px to wciąż ~3× wyświetlany ~390 px (ostre na DPR3), ale o ~30%
 * mniej bajtów niż 1536 → szybszy LCP pod throttlingiem 4G. Quality (q92) bez zmian.
 */
export const MOBILE_HERO_MAX_LONG_EDGE = 1280;

export const DESKTOP_HERO_WIDTH = 2560;
export const DESKTOP_HERO_HEIGHT = 966;

/**
 * Limit dłuższego boku dla zwykłych obrazów CMS (Instagram, galeria, tła sekcji).
 * Pliki powyżej tego limitu wychodziły po sync jako 1–2 MB mimo WebP q92 (oryginały
 * z aparatu ~4000 px). Na żadnym wyświetlaczu różnica 1920 px vs 4000 px nie jest
 * widoczna przy elementach <50 vw. Bez straty jakości q92.
 */
export const CMS_IMAGE_MAX_LONG_EDGE = 1920;
