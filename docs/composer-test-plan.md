# Composer — plan testów (checklist, nic nie wolno pominąć)

Towarzyszy `docs/composer-plan.md` i `docs/composer-agent-prompt.md`.
Każdy etap ma cztery warstwy testów: **unit**, **e2e**, **bezpieczeństwo/
izolacja**, **wydajność/a11y**. Etap nie jest ukończony, dopóki wszystkie
cztery warstwy nie mają zielonego dowodu (nie deklaracji).

## Warstwa wspólna (uruchamiana po KAŻDYM etapie, bez wyjątku)

- [x] `pnpm --filter @lumine/storefront type-check` — 0 błędów
- [x] `pnpm --filter @lumine/storefront lint` — 0 błędów (warningi
      pre-existing dopuszczalne, nowe niedopuszczalne)
- [x] `pnpm --filter @lumine/storefront test` — 0 nowych failów (223/223)
- [x] `pnpm --filter @lumine/storefront build` — build produkcyjny przechodzi
- [x] Sonda: HTML strony głównej dla anonimowego żądania nie zawiera
      `data-cms`, `data-cms-input`, `Tryb edycji` ani żadnego nowego
      identyfikatora composera (`pnpm verify:composer-etap1`, prod curl)
- [x] Sonda: każdy nowy endpoint API zapisu/edycji zwraca 401/403 bez
      ważnej sesji admina magazynu (`/api/cms-preview/enable`, `/api/composer/theme-tokens`)

---

## Etap 1 — Motyw (kolory + fonty)

### Unit
- [x] Zod schema tokenów motywu: odrzuca kolor spoza formatu OKLCH,
      odrzuca font spoza białej listy, akceptuje poprawny payload
- [x] Funkcja renderująca `:root { --... }` z tokenów — snapshot test na
      pełnym zestawie tokenów + na wartościach domyślnych (fallback gdy
      metadata puste/uszkodzone)
- [x] Kalkulator kontrastu WCAG: test na parach kolorów o znanym
      współczynniku (np. czerń/biel = 21:1, dwa bliskie szarości < 4.5:1)
      — zero fałszywych negatywów na obecnej palecie brandowej

### E2E (Playwright)
- [x] Zaloguj się jako admin → otwórz edytor motywu → zmień kolor accent →
      zapisz → w iframie podglądu nowy kolor widoczny po `cms:reload`
      (`pnpm test:e2e:composer-etap1`, 10/10)
- [x] Zmień font nagłówków na inny z listy → zapisz → w podglądzie widoczny
      nowy font w `#lumine-theme-tokens` (`--font-display`; hero h1 używa
      `.font-binerka` — assert na h2/CSS, nie na CONCEPT)
- [x] Wybór koloru tekstu na tle dającego kontrast < 4.5:1 → UI pokazuje
      ostrzeżenie WCAG (nie blokuje zapisu, ale ostrzega — zgodnie z planem)
- [x] Odznaczony/wylogowany użytkownik nie widzi żadnej trasy edytora
      motywu (redirect/401 na `/panel/cms/...`)

### Bezpieczeństwo / izolacja
- [x] Anon HTML bez sesji — brak `data-cms`, brak markupu edytora; motyw
      Etap 1 zapisuje się do `Store.metadata` (live, bez osobnego draft store)
- [x] Payload z kolorem w formacie innym niż OKLCH (np. wstrzyknięty
      `</style><script>`) — zapis odrzucony przez Zod, nie trafia do HTML
      (`isolation.test.ts` + API 401 bez sesji)

### Wydajność / a11y
- [x] Lighthouse mobile: prod baseline LCP 3.4 s / CLS 0; lokalny build
      prod (Etap 1) LCP 4.8 s / CLS 0.001 — różnica LCP wynika z środowiska
      (Vercel CDN vs `pnpm start` lokalnie), nie ze wzrostu `<head>`; blok
      CSS motywu e2e < 1.2 KB
- [x] Preload fontów — ≤4 unikalne woff2, bez nadmiarowych duplikatów (e2e)
- [x] axe-core na stronie głównej — 0 naruszeń contrast-related (e2e)

**Dowody:** `apps/storefront/scripts/verify-composer-etap1.mjs`,
`tests-e2e/composer-theme.e2e.spec.ts`, `docs/lighthouse-etap1-*.json`
(2026-07-07).

---

## Etap 2 — Sekcje jako lista (rdzeń)

### Unit
- [ ] Migrator stare bloki → format sekcji: test dla KAŻDEGO istniejącego
      typu bloku (hero, about, brandingCta, testimonials, faq, gallery,
      categoryTiles, bestsellers) — round-trip zachowuje wszystkie pola
- [ ] Zod schema per typ sekcji w rejestrze — walidacja props (brak
      wymaganego pola = odrzucone, dodatkowe nieznane pole = odrzucone
      albo zignorowane zgodnie z decyzją projektową, ale jawnie przetestowane)
- [ ] Renderer `SectionRenderer`: nieznany/uszkodzony typ sekcji → nie
      wywala strony (renderuje nic + log, nie 500)
- [ ] Limit liczby sekcji na stronę (np. 20) egzekwowany przy zapisie

### E2E (Playwright)
- [ ] **Test regresji migracji**: dla KAŻDEJ istniejącej strony CMS
      (home, shop, logo-3d, gotowe-wzory, certyfikaty, o-nas) —
      zrzut HTML/screenshot PRZED migracją vs PO migracji na sections —
      różnice tylko kosmetyczne (data-atrybuty), treść i układ identyczne
- [ ] Dodaj nową sekcję z katalogu w edytorze → zapisz jako draft →
      podgląd pokazuje nową sekcję → produkcja (bez publikacji) NIE
      pokazuje nowej sekcji
- [ ] Kliknij „Opublikuj" → produkcja pokazuje nową sekcję (revalidate
      zadziałał)
- [ ] Usuń sekcję w draft → opublikuj → zniknęła z produkcji
- [ ] Przestaw kolejność dwóch sekcji (drag&drop w panelu) → zapisz →
      kolejność zachowana po odświeżeniu edytora (przeżywa reload)
- [ ] Duplikuj sekcję → powstaje kopia z nowym id, niezależna od oryginału
      (edycja kopii nie zmienia oryginału)
- [ ] Ukryj sekcję (bez usuwania) → nie renderuje się na stronie, nadal
      widoczna (wyszarzona) na liście w edytorze
- [ ] **Wersjonowanie**: opublikuj 3 razy z różną treścią → historia ma
      3 wpisy → „Przywróć wersję 1" → produkcja wraca do treści z wersji 1
- [ ] Klik sekcji w iframie (postMessage) → podświetla właściwy element
      na liście sekcji w panelu (nie tylko pola formularza jak w v1)
- [ ] Dwie karty przeglądarki edytujące tę samą stronę jednocześnie —
      zapis z jednej nie gubi cicho zmian z drugiej (albo explicit
      last-write-wins z ostrzeżeniem, albo conflict guard — zdecyduj
      i przetestuj wybrane zachowanie)

### Bezpieczeństwo / izolacja
- [ ] Draft niepublikowany nie jest osiągalny żadną ścieżką dla
      niezalogowanego (bezpośredni fetch klucza draft przez API zwraca
      401/403, nie tylko „nie renderuje się w UI")
- [ ] Rich-text w propsach sekcji przechodzi przez sanityzację przed
      zapisem (XSS payload w treści sekcji → oczyszczony, nie wykonuje się
      w renderze)
- [ ] Zapis sekcji z >20 elementami → odrzucony (limit z Zod)

### Wydajność / a11y
- [ ] Strona złożona WYŁĄCZNIE w composerze (5-8 sekcji z katalogu) →
      Lighthouse mobile: LCP < 2.0s, CLS < 0.05, INP < 200ms, JS strony
      < 200 KB — dokładnie te same progi co reszta serwisu
  - [ ] Strona z bogatym zestawem sekcji (wszystkie 12 typów) — budżet JS
        nadal < 200 KB (żaden typ sekcji nie dociąga ciężkiej biblioteki
        do klienta bez lazy-load)
- [ ] Test hierarchii nagłówków: dokładnie jedno h1 na stronie złożonej
      w composerze, sekcje używają h2 (automatyczny test DOM, nie ręczny)
- [ ] axe-core na przykładowej stronie złożonej z 5 różnych typów sekcji —
      0 nowych naruszeń
- [ ] Alt text: sekcja z obrazem bez alt → warning w edytorze (UI), i/lub
      fallback pusty alt="" w renderze (nigdy brak atrybutu)

---

## Etap 3 — Tokeny układu

### Unit
- [ ] Mapa token→klasa: dla KAŻDEJ wartości enum (align, size, columns,
      spacing, background, variant) istnieje wpis w białej liście —
      test iteruje po enumie i sprawdza że mapa nie zwraca undefined
- [ ] Wartość spoza enuma (np. wstrzyknięta ręcznie do bazy) → fallback do
      default, NIE przechodzi surowa do className
- [ ] Nadpisania mobile: token layout z osobnym wariantem <lg — test że
      obie klasy (bazowa + `lg:`) trafiają do wyniku

### E2E (Playwright)
- [ ] Zmień wyrównanie sekcji na „prawo” → zapisz → w podglądzie desktop
      element wyrównany do prawej (assert computed style/bounding box)
- [ ] Zmień rozmiar S→L → zapisz → element realnie większy w podglądzie
- [ ] Ustaw layout inny na mobile niż desktop → przełącz podgląd na
      Mobile (390px) → assert że mobilny wariant jest aktywny
- [ ] Zmiana liczby kolumn (1→3) na sekcji z listą elementów (np. FAQ,
      testimonials) → elementy realnie przepływają w 3 kolumny

### Bezpieczeństwo / izolacja
- [ ] Payload z `align: "<script>...</script>"` (próba wstrzyknięcia przez
      pole enum) → Zod odrzuca przed zapisem

### Wydajność / a11y
- [ ] Przełączanie wariantu layoutu w podglądzie NIE generuje nowego pliku
      CSS w sieci (network tab: liczba `.css` requestów bez zmian) —
      dowód, że to tylko podmiana klas z prekompilowanego Tailwinda
- [ ] CLS = 0 przy zmianie rozmiaru sekcji w podglądzie (brak przeskoku
      layoutu przy re-renderze)
- [ ] Lighthouse na stronie z niestandardowym layoutem (np. sekcja 3-kol.,
      pełna szerokość) — progi bez zmian vs baseline

---

## Etap 4 — Wygoda (opcjonalny)

### Unit
- [ ] Parser contentEditable → wartość pola formularza: HTML wklejony
      z zewnątrz (np. z Worda) jest oczyszczony do plain text/dozwolonych
      tagów przed zapisem

### E2E
- [ ] Kliknij tekst w iframie → edytuj inline → wartość synchronizuje się
      z polem w panelu → zapisz → zmiana trwała po reloadzie
- [ ] Klik w obrazek w iframie → otwiera media-picker w szufladzie (nie
      nowe okno/tab) → wybór obrazu podmienia go w podglądzie
- [ ] Wstaw sekcję z presetu (wypełnioną treścią demo) → treść zgodna
      z presetem, w pełni edytowalna dalej

### Bezpieczeństwo / izolacja
- [ ] contentEditable dostępny WYŁĄCZNIE w draftMode — sprawdź że atrybut
      `contenteditable` nie pojawia się w HTML zwykłego klienta

### Wydajność / a11y
- [ ] Brak regresji vs Etap 1-3 (pełny przebieg Lighthouse ponownie)

---

## Etap 5 — Port do moduly

### Unit
- [ ] Wszystkie testy jednostkowe z Etapów 1-4 przeniesione i zielone
      w kontekście pakietów `@moduly/cms-preview`, `@moduly/composer`

### E2E / instalacja
- [ ] `moduly create sklep --target <tmp>` → `pnpm install` →
      `pnpm --filter <projekt> build` — build przechodzi ze świeżo
      zainstalowanym composerem
- [ ] W świeżo utworzonym projekcie: zaloguj się do panelu → otwórz
      composer → dodaj sekcję → zapisz — działa identycznie jak w Lumine
- [ ] `node scripts/verify-blueprint.mjs` (jeśli dotyczy tego pakietu)
      rozszerzony o composer — zielony

### Bezpieczeństwo / izolacja
- [ ] Te same sondy co warstwa wspólna, uruchomione na świeżo
      wygenerowanym projekcie (nie tylko na Lumine)

### Wydajność / a11y
- [ ] Lighthouse na stronie głównej świeżo utworzonego projektu (starter)
      ze złożoną w composerze przykładową stroną — te same progi

---

## Jak raportować wynik (dla Composera)

Po każdym etapie wklej w podsumowaniu:
1. Listę punktów tej checklisty z `[x]`/`[ ]` — bez pomijania wierszy.
2. Rzeczywisty output komend (typecheck/lint/test/build), nie samo „zielone”.
3. Wynik sond curl (kod HTTP, liczba wystąpień `data-cms`).
4. Wynik Lighthouse (liczby, nie „bez zmian” bez danych).

Jeśli którykolwiek punkt nie może być zrealizowany (np. brak środowiska
do Lighthouse) — zaznacz `[ ] BLOCKED: <powód>`, nie oznaczaj fałszywie
jako zrobiony.
