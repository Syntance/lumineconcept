# ADR 006: Rozmiar pierwszej strony listingu jest decyzją SEO, nie tylko UX

Data: 2026-09-06 · Status: przyjęte

## Kontekst

Po wdrożeniu ADR 005 w Search Console zostało 27 z 43 produktów na statusie
„Strona wykryta – obecnie niezindeksowana": Google zna adres z `sitemap.xml`, ale go nie zeskanował.
Sprawdzenie adresu URL pokazywało przy nich „Strona odsyłająca: **Nie wykryto**".

Zliczenie odnośników w HTML renderowanym serwerowo (bez JS, czyli tak jak widzi je crawler)
potwierdziło przyczynę:

| Listing | Linki do produktów w HTML | Produktów w kategorii |
| --- | ---: | ---: |
| `/sklep/gotowe-wzory/tabliczki-informacyjne` | 12 | 17 |
| `/sklep/gotowe-wzory/tabliczki-qr` | 12 | 14 |
| `/sklep/gotowe-wzory` (zbiorczy) | 12 | 43 |

Listing pobierał `INITIAL_PAGE_SIZE = 12` produktów po stronie serwera, a resztę siatki
dociągał `ShopGridClient` fetchem po hydracji. Odnośników powstających dopiero w JS crawler
nie odkrywa. W efekcie **pięć produktów nie miało w całym serwisie ANI JEDNEGO linku
wewnętrznego** — `ekspozytor-na-voucher-podarunkowy`, `instrukcja-mycia-rak`,
`instrukcja-mycia-rak-owalna`, `tabliczka-z-kodami-qr-fala`, `zalecenia-pielegnacyjna`.
Adres znany wyłącznie z sitemapy dostaje najniższy priorytet skanowania, co dokładnie
odpowiada obserwowanemu statusowi.

Stała była zduplikowana w dwóch plikach (`GotoweWzoryListingPage.tsx`,
`sklep/certyfikaty/page.tsx`), więc rozjazd między listingami był kwestią czasu.

## Decyzja

Jedna stała `LISTING_INITIAL_PAGE_SIZE = 24` w `lib/shop/listing-page-size.ts`, używana przez
oba listingi. Wartość musi pokrywać NAJWIĘKSZĄ kategorię (17), bo każdy produkt należy do co
najmniej jednej kategorii i to jej listing jest jego gwarantowanym linkiem wewnętrznym.
24 daje 7 sztuk zapasu. Test regresji pilnuje zapasu, górnego ograniczenia i tego, że żaden
listing nie wróci do własnej liczby.

## Odrzucone

- **Renderowanie wszystkich 43 produktów serwerowo.** Listing zbiorczy `/sklep/gotowe-wzory`
  agreguje wszystkie kategorie; każdy kafelek to zdjęcie w HTML, więc rośnie LCP.
  Produkty spoza pierwszych 24 mają link ze swojej kategorii, więc nic nie tracimy.
- **Ukryty blok z linkami do wszystkich produktów.** Odnośniki niewidoczne dla użytkownika
  to sygnał, którego nie chcemy wysyłać Google, a korzyść jest ta sama co z podniesienia progu.
- **Paginacja z `rel=next` na listingach.** Poprawne, ale to nowy komponent i nowy stan URL
  dla 43 produktów. Do rozważenia, gdy katalog urośnie ponad ~50 sztuk.

## Konsekwencje

- Zero osieroconych produktów: zweryfikowane zliczeniem `href` w HTML wszystkich listingów
  (43/43 produktów ma link).
- Listingi kategorii mają większy HTML (do 17 kafelków zamiast 12). Listing zbiorczy rośnie
  z 12 do 24 kafelków — do obserwacji w Core Web Vitals po wdrożeniu.
- Gdy kategoria przekroczy 24 produkty, część znów zostanie bez linków. Test tego nie wykryje
  (nie odpytuje Medusy) — pilnuje tylko, by próg nie spadł poniżej zapasu. Przy rozbudowie
  katalogu wrócić do paginacji z linkami w HTML.
