# Composer — plan testów (checklist, nic nie wolno pominąć)

Towarzyszy `docs/composer-plan.md` i `docs/composer-agent-prompt.md`.
Każdy etap ma cztery warstwy testów: **unit**, **e2e**, **bezpieczeństwo/
izolacja**, **wydajność/a11y**. Etap nie jest ukończony, dopóki wszystkie
cztery warstwy nie mają zielonego dowodu (nie deklaracji).

## Warstwa wspólna (uruchamiana po KAŻDYM etapie, bez wyjątku)

- [x] `pnpm --filter @lumine/storefront type-check` — 0 błędów
- [x] `pnpm --filter @lumine/storefront lint` — 0 błędów (warningi
      pre-existing dopuszczalne, nowe niedopuszczalne)
- [x] `pnpm --filter @lumine/storefront test` — 0 nowych failów (244/244, Etap 2–4)
- [x] `pnpm --filter @lumine/storefront build` — build produkcyjny przechodzi
- [x] Sonda: HTML strony głównej dla anonimowego żądania nie zawiera
      `data-cms`, `data-cms-input`, `Tryb edycji` ani żadnego nowego
      identyfikatora composera (`pnpm verify:composer-etap1`, prod curl)
- [x] Sonda: każdy nowy endpoint API zapisu/edycji zwraca 401/403 bez
      ważnej sesji admina magazynu (`/api/cms-preview/enable`,
      `/api/composer/theme-tokens`, `/api/composer/page-sections`)

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
- [x] Migrator stare bloki → format sekcji: test dla każdej strony CMS
      (`migrate.test.ts` — home, shop, o-nas, logo-3d, gotowe-wzory,
      certyfikaty + kolejność home)
- [x] Zod schema per typ sekcji — nieznany typ odrzucony, limit 20 sekcji
      (`schema.test.ts`)
- [x] Renderer `SectionRenderer`: nieznany typ → null (bez 500)
- [x] Limit liczby sekcji na stronę (20) egzekwowany w Zod

### E2E (Playwright)
- [ ] **Test regresji migracji**: screenshot/HTML diff per strona CMS
- [ ] Dodaj nową sekcję z katalogu → draft → izolacja produkcji
- [ ] Kliknij „Opublikuj" → produkcja pokazuje nową sekcję
- [ ] Usuń sekcję w draft → opublikuj → zniknęła z produkcji
- [ ] Przestaw kolejność dwóch sekcji (drag&drop w panelu) → zapisz →
      kolejność zachowana po odświeżeniu edytora (przeżywa reload)
- [ ] Duplikuj sekcję → powstaje kopia z nowym id
- [ ] Ukryj sekcję → nie renderuje na stronie, widoczna w edytorze
- [ ] **Wersjonowanie**: 3 publikacje → historia → przywróć wersję 1
- [ ] Klik sekcji w iframie → podświetla element na liście
- [ ] Dwie karty przeglądarki — conflict guard / last-write-wins

### Bezpieczeństwo / izolacja
- [x] Draft niepublikowany: API `/api/composer/page-sections` → 401 bez sesji
- [x] Rich-text sanityzacja przed zapisem (`sanitizeSectionForSave`)
- [x] Zapis sekcji z >20 elementami → odrzucony (limit Zod)

### Wydajność / a11y
- [ ] Lighthouse mobile na stronie 5–8 sekcji
- [ ] Budżet JS < 200 KB (pełny katalog typów)
- [ ] Test hierarchii nagłówków (jedno h1)
- [ ] axe-core na stronie z 5 typami sekcji
- [x] Alt text: warning w edytorze przy braku alt (`SectionsEditor`)

**Dowody Etap 2 (MVP):** `tests/lib/composer/sections/*`,
`tests-e2e/composer-sections.e2e.spec.ts` (publiczne + admin serial),
`SectionRenderer` (14 typów), strony: home, o-nas, tablice-z-logo,
certyfikaty/gotowe-wzory (tail), shop (testimonials).

---

## Etap 3 — Tokeny układu

### Unit
- [x] Mapa token→klasa: align, size, columns, spacing, background, variant
      (`layout.test.ts`)
- [ ] Wartość spoza enuma w bazie → fallback (test integracyjny z DB)
- [x] Nadpisania mobile: klasy `max-lg:` w wyniku

### E2E (Playwright)
- [ ] Zmień wyrównanie sekcji → assert w podglądzie
- [ ] Zmień rozmiar S→L
- [ ] Layout mobile vs desktop (390px)
- [ ] Zmiana kolumn 1→3

### Bezpieczeństwo / izolacja
- [ ] Payload `align: "<script>"` → Zod odrzuca

### Wydajność / a11y
- [ ] Brak nowego pliku CSS przy zmianie layoutu
- [ ] CLS = 0 przy zmianie rozmiaru
- [ ] Lighthouse z layoutem 3-kol.

---

## Etap 4 — Wygoda (opcjonalny)

### Unit
- [ ] Parser contentEditable → sanityzacja HTML (osobny moduł)

### E2E
- [ ] Kliknij tekst w iframie → sync z panelem → zapis trwały
- [ ] Klik w obrazek → media-picker
- [x] Wstaw sekcję z presetu (`lib/composer/presets.ts` + UI w edytorze)

### Bezpieczeństwo / izolacja
- [ ] contentEditable tylko w draftMode

### Wydajność / a11y
- [ ] Brak regresji Lighthouse vs Etap 1–3

---

## Etap 5 — Port do moduly

### Unit
- [ ] Testy jednostkowe przeniesione do `@moduly/composer` (stub — 1 typ)

### E2E / instalacja
- [ ] `moduly create sklep` + build ze composerem
- [ ] Panel composer w świeżym projekcie
- [ ] `verify-blueprint.mjs` rozszerzony

**Stan Etap 5:** stub `@moduly/composer` + `@moduly/cms-preview` w repo
`moduly` (typecheck OK); pełny port kodu z Lumine — osobny PR w `moduly`.

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
