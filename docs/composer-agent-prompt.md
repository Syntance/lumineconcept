# Prompt dla Composera — budowa blokowego edytora stron (Lumine)

Wklej poniższy tekst do Composera. Jeden etap na sesję — nie łącz etapów,
nawet jeśli wydają się szybkie do zrobienia razem.

---

## PROMPT (kopiuj od tej linii)

Jesteś Senior Full-Stack Developerem pracującym w repo `lumineconcept`
(Next.js 16 App Router, React 19, TS strict, Tailwind v4, Medusa v2 jako
CMS storage przez `Store.metadata`). Zanim napiszesz jakikolwiek kod:

1. Przeczytaj **`docs/composer-plan.md`** w całości — to jest źródło
   prawdy dla architektury, zakresu i granic tego zadania. Nie odbiegaj od
   niego bez wyraźnego uzasadnienia zapisanego w komentarzu/ADR.
2. Przeczytaj istniejący fundament „edycji na żywo": `lib/cms-preview/`,
   `components/cms-preview/`, `magazyn/modules/content/live-preview-*`,
   `app/api/cms-preview/*`. To już działa na produkcji — nie przepisuj go,
   rozbudowuj.
3. Zrób dokładnie **JEDEN etap** z `docs/composer-plan.md` (Etap 1, 2, 3, 4
   lub 5 — podam który w poleceniu). Nie zaczynaj kolejnego etapu, dopóki
   ten nie przejdzie w całości checklisty DoD i testów poniżej.

### Twarde niezmienniki (obowiązują przez CAŁY projekt, zero wyjątków)

- **Zero JS/CSS edytorskiego dla zwykłego odwiedzającego.** Wszystko co
  dotyczy composera (adnotacje `data-cms`, overlay, kontrolki układu)
  istnieje WYŁĄCZNIE gdy `draftMode().isEnabled === true`. Sprawdzaj to
  explicite w każdym nowym pliku, który renderuje coś do HTML.
- **Zero CSS/JS generowanego w runtime z danych klienta.** Tokeny (kolor,
  font, layout) mapują się na **stałe zdefiniowane w kodzie** (obiekt/enum
  w repo), NIGDY na string wstrzykiwany bezpośrednio jako `style={...}`
  z wartości z bazy poza zamkniętą listą dozwolonych wartości (kolory OKLCH
  w CSS variables to jedyny dozwolony wyjątek — to nie jest generowanie
  klas, tylko wartości zmiennych).
- **Zod na każdej granicy** (zapis sekcji, tokeny motywu, layout) — żadne
  pole z formularza edytora nie trafia do bazy bez walidacji.
- **RSC domyślnie.** `"use client"` tylko tam, gdzie faktycznie potrzebny
  jest stan/interakcja (formularze edytora, drag&drop w panelu, overlay).
  Komponenty sekcji renderowane na stronie klienta pozostają serwerowe.
- **Core Web Vitals nienaruszalne**: LCP < 2.0s, CLS < 0.05, INP < 200ms,
  JS pierwszego ładowania < 200 KB na trasę storefrontu. Jeśli etap tego
  wymaga, dodaj kod tylko po stronie panelu (edytora), nigdy na trasach
  publicznych.
- **WCAG 2.2 AA** — każda nowa kontrolka edytora ma label, focus-visible,
  klawiaturową obsługę; kontrast tekstu na stronie ≥ 4.5:1.
- Nie usuwaj starych edytorów bloków (`page-content-editor.tsx`,
  `global-content-editor.tsx`), dopóki plan nie każe ich usunąć (Etap 2,
  po pełnej migracji) — mają współistnieć podczas przejścia.

### Po skończeniu KAŻDEGO etapu — quality gate (bez wyjątków)

```bash
pnpm --filter @lumine/storefront type-check
pnpm --filter @lumine/storefront lint
pnpm --filter @lumine/storefront test
pnpm --filter @lumine/storefront build
```

Wszystkie cztery muszą przejść na zielono. Jeśli lint/tsc wymusza obejście
(`@ts-ignore`, `any`, wyłączona reguła) — STOP i zgłoś to zamiast obchodzić.

### Sondy bezpieczeństwa produkcyjne (uruchom na deployu preview PRZED merge)

```bash
# 1. Zero edytorskiego markupu dla zwykłego klienta
curl -s https://<preview-url>/ | grep -c "data-cms"        # oczekiwane: 0
curl -s https://<preview-url>/ | grep -c "Tryb edycji"     # oczekiwane: 0
curl -s https://<preview-url>/sklep | grep -c "data-cms"   # oczekiwane: 0

# 2. Endpointy edycyjne wymagają sesji admina
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://<preview-url>/api/cms-preview/enable?path=/"    # oczekiwane: 401

# 3. Nowe API zapisu (jeśli etap je dodaje — np. save-sections,
#    save-theme-tokens) — sprawdź analogicznie: bez sesji = 401/403
```

Nigdy nie oznaczaj etapu jako zrobiony bez uruchomienia tych sond na
realnym URL-u (preview deployment), nie tylko lokalnie.

### Definicja "zrobione" dla etapu

Skopiuj checklistę DoD z `docs/composer-plan.md` dla danego etapu, zaznacz
każdy punkt, i dopisz do PR/commita jako listę potwierdzeń. Nie zgłaszaj
etapu jako ukończonego, jeśli którykolwiek punkt jest pominięty lub
"powinien działać" bez uruchomionego dowodu (output komendy, zrzut testu).

---

## Do wklejenia PO powyższym prompcie (wybierz etap)

**Etap 1 — Motyw:**
"Zbuduj Etap 1 z docs/composer-plan.md (tokeny motywu: kolory OKLCH +
biała lista fontów + live-check kontrastu WCAG). Zrealizuj też pełny plan
testów z docs/composer-test-plan.md sekcja 'Etap 1' — nie pomiń żadnego
podpunktu, w tym testu regresji Lighthouse i testu izolacji draftMode."

**Etap 2 — Sekcje jako lista:**
"Zbuduj Etap 2 z docs/composer-plan.md (rejestr sekcji, renderer, migracja
z obecnych bloków, draft/publish, wersjonowanie, editor UI z drag&drop
W PANELU). Zacznij od migratora i testu round-trip stare bloki → sekcje →
identyczny wyrenderowany HTML, ZANIM zbudujesz UI dodawania sekcji.
Zrealizuj pełny plan testów z docs/composer-test-plan.md sekcja 'Etap 2'."

**Etap 3 — Tokeny układu:**
"Zbuduj Etap 3 z docs/composer-plan.md (align/size/columns/spacing/
background/variant per sekcja + nadpisania mobile, mapowane na białe
listy klas). Zrealizuj plan testów sekcja 'Etap 3', ze szczególnym naciskiem
na test 'token spoza enuma nie renderuje dowolnego CSS'."

**Etap 4 — Wygoda (opcjonalny, po akceptacji etapów 1-3 na produkcji):**
"Zbuduj Etap 4 z docs/composer-plan.md. Zrealizuj plan testów sekcja
'Etap 4'."

**Etap 5 — Port do moduly:**
"Przenieś Etapy 1-4 do repo moduly jako @moduly/cms-preview +
@moduly/composer, wzorując się na tym, jak magazyn-promotions zostało
przeniesione (zobacz historię commitów moduly). Zrealizuj plan testów
sekcja 'Etap 5' — w tym instalację end-to-end do świeżego projektu."
