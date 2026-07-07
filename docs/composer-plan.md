# Composer — plan budowy blokowego edytora stron (bez kosztu wydajności)

Stan: zaplanowane 2026-07-07 · Fundament (WDROŻONE, commity `dd217d07`+`11adcb3e`):
edytor „na żywo" — draftMode bramkowany sesją admina, iframe fullscreen w panelu,
przełącznik Desktop/Tablet/Mobile, postMessage select/reload, adnotacje
`data-cms`/`data-cms-input`, świeży odczyt treści i **zdjęcia bez Redeploy w
podglądzie**, CSP `frame-ancestors 'self'`. Sondy po każdym deployu:
`data-cms` w HTML klienta = 0, `/api/cms-preview/enable` bez sesji = 401.

## Zasada nadrzędna (nie do negocjacji)

Render produkcyjny = czysty RSC/statyczny HTML. Composer steruje WYŁĄCZNIE:
(a) danymi treści, (b) tokenami mapowanymi na klasy z białych list w kodzie,
(c) zmiennymi CSS motywu. **Żadnego** CSS generowanego w runtime, stylów
inline z bazy, pozycjonowania pikselowego ani JS edytorskiego dla klientów.
To odróżnia nas od Elementora i jest źródłem gwarancji PageSpeed.

## Etap 1 — Motyw (kolory + fonty)

1. **Tokeny motywu** w `Store.metadata.themeTokens`: paleta OKLCH
   (`primary, accent, background, foreground, muted, border, brand-*`),
   `radius`, opcjonalnie skala odstępów. Zod schema + defaults = obecne
   wartości z `globals.css`.
2. **Render**: RSC w root layout wstrzykuje `<style>:root{--...}</style>`
   (kilkaset bajtów; draft czyta świeżo → zmiana koloru widoczna od razu
   w podglądzie).
3. **Fonty — biała lista self-hosted** (next/font wymaga deklaracji
   statycznych): deklarujemy N fontów z `preload:false` +
   `adjustFontFallback`; token wybiera aktywny per rola (display/body);
   `<link rel="preload">` tylko dla aktywnego. Dodanie fontu do listy =
   zadanie dev (świadomie).
4. **Edytor motywu** w zakładce „Globalne" podglądu: pickery kolorów
   (OKLCH z podglądem), selekty fontów, **live-check kontrastu WCAG**
   (ostrzeżenie < 4.5:1 — wymóg EAA, nie kosmetyka).
5. DoD: zmiana koloru/fontu w edytorze widoczna w iframe po zapisie;
   HTML klienta bez zmian poza wartościami zmiennych; testy parsera tokenów.

## Etap 2 — Sekcje jako lista (rdzeń composera)

1. **Model**: strona = `sections: Array<{ id, type, props, layout, hidden? }>`.
   Storage: **klucz per strona** `pageSections:<pageId>` (mniejsze zapisy,
   mniej konfliktów niż jeden blob pageContent).
2. **Rejestr sekcji** (`lib/composer/registry.ts`): typ → { komponent RSC,
   Zod schema props, defaults, definicja formularza edytora, miniatura PNG }.
   Katalog startowy: `hero, textImage, richText, gallery, faq, testimonials,
   cta, categoryTiles, bestsellers, divider, contactForm, embedMap`.
   Każdy komponent ręcznie zoptymalizowany (obrazy next/image + sizes,
   nagłówki h2, LCP-aware) — klient nie jest w stanie zepsuć jakości.
3. **Renderer** `<SectionRenderer sections pageId>`: switch po typie,
   `cmsAttr("page.<id>.sections.<sectionId>")` na rootach; wymusza
   dokładnie jedno H1 na stronie (hero) i hierarchię nagłówków.
4. **Migracja**: konwerter stare bloki → sections (parser czyta OBA formaty;
   render preferuje sections). Istniejące strony Lumine przechodzą
   konwerterem — stają się pierwszymi szablonami.
5. **Editor UI** (szuflada podglądu): lista sekcji z drag&drop **w panelu**
   (dnd w panelu nie dotyka strony klienta), dodaj z katalogu (modal
   z miniaturami), duplikuj / ukryj / usuń; klik sekcji w iframe podświetla
   ją na liście; overlay w iframe dostaje przyciski „+" między sekcjami.
6. **Draft/publish** (zmiana podejścia vs dziś): edycje composera zapisują
   się do klucza-cienia `pageSectionsDraft:<pageId>` czytanego TYLKO w
   draftMode; przycisk **„Opublikuj"** kopiuje draft→live (+ revalidate).
   Composer zwiększa ryzyko „rozgrzebanej" strony — klient musi móc
   eksperymentować bez publikowania.
7. **Wersjonowanie**: przy publikacji snapshot do `pageSectionsHistory`
   (ostatnie 10) + „Przywróć wersję" w edytorze. Tania polisa na
   „klient zepsuł stronę".
8. Walidacja Zod przy zapisie + limit sekcji/strona (20) + sanityzacja
   rich-text (istniejący wzorzec bez isomorphic-dompurify).
9. DoD: nowa strona złożona wyłącznie w composerze wygląda i mierzy się
   (Lighthouse) identycznie jak ręczna; e2e: dodaj sekcję → publikuj →
   widoczna na produkcji; draft niewidoczny dla klientów.

## Etap 3 — Tokeny układu i rozmiarów per sekcja

1. `layout` per sekcja: `align (L/C/P), size (S/M/L), columns (1-4),
   spacing (S/M/L), background (token|image|none), fullWidth, variant
   (light/dark)` + **nadpisania mobile** (drugi zestaw dla <lg).
2. **Białe listy klas** w kodzie (`const LAYOUT_CLASSES = {...}` — pełne
   nazwy klas, więc Tailwind je widzi bez safelist). Token spoza listy =
   fallback do default (Zod enum).
3. Kontrolki układu w formularzu sekcji (segmented controls + podgląd na
   żywo po zapisie).
4. DoD: zmiana układu nie generuje nowego CSS (tylko podmiana klas
   w HTML); CLS = 0 przy przełączaniu wariantów.

## Etap 4 (opcjonalny) — wygoda

- Inline edycja krótkich tekstów w iframe (contentEditable → wartość wraca
  postMessage do pola formularza; zapis nadal jedną ścieżką server action).
- Klik w obrazek w iframe → otwiera media-picker w szufladzie.
- Biblioteka presetów sekcji (wypełnione treścią demo) i całych stron.
- A11y/perf lint w edytorze: brak alt → warning; za duży obraz → info.

## Etap 5 — port do moduly

`@moduly/cms-preview` (attr, overlay, messages) + `@moduly/composer`
(registry, renderer, editor) + katalog sekcji w starterach; wzorzec portu
jak `magazyn-promotions` (transformy importów, tsc-loop). CLI: composer
w `create strona/sklep` domyślnie.

## Świadome granice (nie robimy)

- Freeform drag&drop na stronie / pozycjonowanie pikselowe / dowolny CSS
  od klienta — to jest dokładnie mechanizm, który czyni Elementora wolnym.
- Dowolne fonty spoza białej listy (koszt LCP/CLS).
- Zagnieżdżone kolumny-w-kolumnach bez limitu (katalog sekcji zamiast tego).

## Ryzyka i decyzje otwarte

- **Rozmiar metadata**: sekcje per-page-key mieszczą się w JSONB; przy
  >~200 KB/strona rozważyć osobny model w Medusie (nie blokuje startu).
- **Spójność edytorów**: legacy edytory bloków żyją do końca migracji —
  po niej usunąć (jedno źródło: composer).
- **cms-wiring test**: rozszerzyć kontrakt o sekcje (każdy typ w rejestrze
  ma formularz i miniaturę) — zastępuje ręczne mapowanie adnotacji.
- 2 pre-existing faile `cms-wiring` naprawiane w osobnej sesji — nie mylić
  z regresjami composera.
