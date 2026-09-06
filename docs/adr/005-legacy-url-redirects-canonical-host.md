# ADR 005: Stare adresy (WordPress) → 308/410, jeden host kanoniczny, favicon

Data: 2026-09-06 · Status: przyjęte

## Kontekst

Raport „Strony" w Google Search Console (stan na 28.08.2026) dla `sc-domain:lumineconcept.pl`:
54 strony zindeksowane, 622 niezindeksowane. Rozbicie niezindeksowanych:

| Przyczyna | Strony | Co to naprawdę jest |
| --- | ---: | --- |
| Nie znaleziono (404) | 204 | stare adresy WooCommerce `/index.php/produkt/...`, `/index.php/kategoria-produktu/...`, wycofane handle pierwszej wersji sklepu, `/favicon.ico` |
| Zeskanowana, niezindeksowana | 225 | 103× `_next/static/*` (w tym kopie pod `www.`), 115× stare adresy WP z parametrami `?per_page=`, 3 PDF-y z `wp-content` |
| Alternatywna z canonicalem | 65 | `?kat=`, `/index`, ścieżki kategorii produktu — poprawne |
| Wykryta, niezindeksowana | 28 | **27 z 43 produktów** + `/deklaracja-dostepnosci` — Google zna z sitemapy, jeszcze nie zeskanował |
| Przekierowanie / robots / duplikat / noindex | 27 / 25 / 24 / 16 | wyłącznie stare adresy WP (`?add-to-cart=`, feedy, `moje-konto`) |

Do tego: `https://www.lumineconcept.pl/*` serwował całą witrynę z kodem 200 (brak przekierowania na domenę
główną), `/sklep/` i `/sklep` istniały równolegle (`skipTrailingSlashRedirect` dla proxy PostHog wyłącza
wbudowane 308), `<title>` każdego PDP kończył się na „| Lumine Concept | Lumine Concept" (meta title
z panelu + szablon root layoutu), a `/favicon.ico` zwracał 404 od migracji.

## Decyzja

1. **Jeden host.** `www.lumineconcept.pl/*` → 308 `https://lumineconcept.pl/*` w `redirects()` next.config
   (`has: host`) — działa na edge'u przed middleware i obejmuje też `_next/static`.
2. **Jeden adres na stronę.** Middleware zdejmuje końcowy slash (308), z wyjątkiem `/ingest` (PostHog).
3. **Stare adresy — trzy wyniki, jedna czysta funkcja** (`lib/seo/legacy-redirects.ts`, `resolveLegacyPath`):
   - stary slug produktu → ten sam produkt (slug identyczny z handle'em) lub jego następca (jawna mapa);
   - bez następcy → najbliższy listing (stara kategoria WP lub słowo kluczowe w slugu);
   - tagi, autorzy, archiwa bloga, feedy, wishlisty, `wp-content`, `cdn-cgi` → **410 Gone**
     (Google usuwa z indeksu szybciej niż przy 404 i przestaje regularnie odpytywać).
   Migawka handle'i Medusy jest statyczna w kodzie — middleware na edge'u nie pyta backendu o każdy
   stary adres; lista starych slugów jest skończona.
4. **Tytuły.** `buildMetadata` wysyła tytuł zawierający nazwę sklepu jako `absolute` (bez szablonu).
5. **Favicon.** `public/favicon.ico` (16/32/48) + PNG 192/512 + apple-touch-icon: monogram „L"
   (ChronicleDisp Bold, cream na brand-800). Sygnet-łuk jest zbyt cienki, by czytać się w 16–48 px.
   Do podmiany, gdy brand dostanie właściwy znak.

## Odrzucone

- Przekierowanie wszystkich starych adresów na stronę główną — Google traktuje masowe przekierowania
  na jedną stronę jak soft-404; nic nie zyskujemy, a tracimy sygnał o „nieistnieniu".
- Reguły `redirects()` w next.config dla każdego starego sluga — brak testowalności i 100+ wpisów;
  czysta funkcja + 72 przypadki testowe z realnego raportu GSC są tańsze w utrzymaniu.
- Przekierowanie `www.` w ustawieniach domeny na Vercelu — poprawne, ale niewersjonowane; kod działa
  niezależnie od konfiguracji hostingu (można dodać jako drugą warstwę).

## Konsekwencje

- Po wdrożeniu w GSC: „Sprawdź poprawność" przy 404 / przekierowanie / duplikat / robots / noindex;
  „Poproś o zindeksowanie" dla 27 produktów ze statusu „wykryta – niezindeksowana".
- Sitemapa jest już zgłoszona (27.07.2026, ostatni odczyt 30.08.2026, 55 stron) — nie zgłaszać ponownie.
- Produkty z krótkimi opisami (45–75 znaków: `piktogram-gasnica`, `pamiatka-pierwszej-komunii-swietej`,
  `podziekowanie-dla-rodzicow`, `zalecenia-pielegnacyjne`, `pudelko-na-koperty-mleczne`) — ryzyko
  „zeskanowana, niezindeksowana" po pierwszym skanie; to zadanie contentowe, nie kodowe.
- PDP renderuje się dynamicznie (root layout woła `headers()` pod nonce CSP) — TTFB jest wyższy niż przy
  ISR, co spowalnia skanowanie; osobna decyzja, poza zakresem tej zmiany.
