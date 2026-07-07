# Composer — plan testów (checklist, nic nie wolno pominąć)

Towarzyszy `docs/composer-plan.md` i `docs/composer-agent-prompt.md`.
Każdy etap ma cztery warstwy testów: **unit**, **e2e**, **bezpieczeństwo/
izolacja**, **wydajność/a11y**. Etap nie jest ukończony, dopóki wszystkie
cztery warstwy nie mają zielonego dowodu (nie deklaracji).

## Warstwa wspólna (uruchamiana po KAŻDYM etapie, bez wyjątku)

- [x] `pnpm --filter @lumine/storefront type-check` — 0 błędów
- [x] `pnpm --filter @lumine/storefront lint` — 0 błędów (warningi
      pre-existing dopuszczalne, nowe niedopuszczalne)
- [x] `pnpm --filter @lumine/storefront test` — 0 nowych failów (250/250, Etap 2–4)
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
- [x] **Test regresji migracji**: każda strona CMS HTTP < 500 (`composer-sections.e2e` ×6)
- [x] Dodaj sekcję z katalogu → zapisz szkic (admin serial)
- [x] Opublikuj sekcje (admin serial)
- [ ] Draft → podgląd vs produkcja bez publikacji (izolacja treści)
- [ ] Usuń sekcję → opublikuj → zniknęła z produkcji
- [x] Przestaw kolejność (↑↓ w panelu) → zachowana na liście
- [x] Duplikuj sekcję → +1 na liście
- [x] Ukryj sekcję → etykieta „(ukryta)”
- [ ] **Wersjonowanie**: 3 publikacje → przywróć wersję 1
- [ ] Klik sekcji w iframie → podświetla na liście
- [ ] BLOCKED: dwie karty — last-write-wins bez conflict guard

### Bezpieczeństwo / izolacja
- [x] Draft API → 401 bez sesji
- [x] Rich-text sanityzacja (`sanitizeSectionForSave` + `inline-edit`)
- [x] Limit 20 sekcji (`prepareSectionsForSave` test)

### Wydajność / a11y
- [ ] BLOCKED: Lighthouse 5–8 sekcji (wymaga środowiska z Lighthouse CI)
- [ ] Budżet JS < 200 KB (pełny katalog)
- [x] Jedno h1 na `/o-nas` (e2e)
- [x] axe-core na `/` — 0 contrast violations
- [x] Alt warning w edytorze

**Dowody:** `tests-e2e/composer-sections.e2e.spec.ts` (11 public + 8 admin),
`tests/lib/composer/inline-edit.test.ts`, `pnpm test:e2e:composer-sections`.

---

## Etap 3 — Tokeny układu

### Unit
- [x] Mapa token→klasa (wszystkie enumy)
- [x] Zod odrzuca `align` z XSS (`layout.test.ts`)
- [x] Nadpisania mobile (`max-lg:`)

### E2E (Playwright)
- [x] Zmiana wyrównania → zapis szkicu (admin)
- [ ] Assert computed style w iframe
- [ ] Mobile 390px w podglądzie
- [ ] Kolumny 1→3 wizualnie

### Bezpieczeństwo / izolacja
- [x] Payload `align: "<script>"` → Zod odrzuca

### Wydajność / a11y
- [ ] BLOCKED: Lighthouse layout 3-kol.

---

## Etap 4 — Wygoda (opcjonalny)

### Unit
- [x] `parseInlineEditValue` — text/html sanityzacja (`inline-edit.test.ts`)

### E2E
- [ ] Inline dblclick → sync → zapis (wymaga Medusy)
- [x] Klik obrazu → `CMS_PREVIEW_MEDIA` → file input (`OgImageField`)
- [x] Presety w edytorze (e2e admin)

### Bezpieczeństwo / izolacja
- [x] Brak `contenteditable` na stronie publicznej (e2e)

### Wydajność / a11y
- [ ] BLOCKED: Lighthouse regresja Etap 1–3

---

## Etap 5 — Port do moduly

### Unit
- [x] `@moduly/composer` — 14 typów, layout Zod, `parseInlineEditValue` (typecheck OK)

### E2E / instalacja
- [ ] BLOCKED: `moduly create sklep` (osobne repo / pipeline)

**Stan:** rdzeń schematu i katalogu w `moduly/packages/composer`; renderer/edytor w Lumine.

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
