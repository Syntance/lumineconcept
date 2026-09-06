/**
 * Ile kafelków produktów listing renderuje po stronie SERWERA (pierwsze żądanie).
 *
 * To nie jest wyłącznie decyzja o wyglądzie — to jedyne linki do produktów,
 * które widzi Googlebot. Resztę siatki dociąga `ShopGridClient` fetchem po
 * hydracji, a takich odnośników crawler nie ma jak odkryć.
 *
 * Przy wartości 12 pięć produktów nie miało ŻADNEGO linku wewnętrznego w całym
 * serwisie (`ekspozytor-na-voucher-podarunkowy`, `instrukcja-mycia-rak`,
 * `instrukcja-mycia-rak-owalna`, `tabliczka-z-kodami-qr-fala`,
 * `zalecenia-pielegnacyjna`) — Google znał je wyłącznie z `sitemap.xml`.
 * Adres bez linków przychodzących dostaje najniższy priorytet skanowania i
 * właśnie tak 27 z 43 produktów utknęło w Search Console na statusie
 * „Strona wykryta – obecnie niezindeksowana".
 *
 * Wartość musi być >= liczby produktów w NAJWIĘKSZEJ kategorii, bo każdy
 * produkt należy do co najmniej jednej kategorii i to jej listing jest jego
 * gwarantowanym linkiem wewnętrznym. Stan na 6.09.2026 (Medusa Store API):
 *
 *   17  tabliczki-informacyjne   <- największa
 *   14  tabliczki-qr
 *    9  gotowe-wzory
 *    6  akcesoria-slubne
 *    4  cenniki
 *    2  certyfikaty
 *    1  dla-najmlodszych
 *    1  tabliczki-na-drzwi
 *
 * 24 daje 7 sztuk zapasu ponad największą kategorię. Gdy któraś przekroczy tę
 * wartość, produkty powyżej progu znów zostaną osierocone — wtedy podnieś
 * stałą albo dołóż listingom paginację z linkami w HTML.
 *
 * Nie podnosimy tego do pełnych 43: `/sklep/gotowe-wzory` agreguje wszystkie
 * kategorie, a każdy dodatkowy kafelek to zdjęcie w HTML i gorszy LCP.
 * Produkty spoza pierwszych 24 na listingu zbiorczym i tak mają link ze swojej
 * kategorii.
 */
export const LISTING_INITIAL_PAGE_SIZE = 24;

/**
 * Największa kategoria w chwili ustawiania stałej — trzymana osobno, żeby test
 * regresji mógł pilnować zapasu, a nie tylko samej liczby.
 */
export const LARGEST_CATEGORY_SIZE_AT_REVIEW = 17;
