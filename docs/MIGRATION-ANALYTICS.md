# Migracja analityki — Syntance standard

Dokument opisuje zmiany nazw eventów po przebudowie analityki (PostHog EU, GA4, Meta Pixel/CAPI).
Dane historyczne pod starymi nazwami **pozostają** — nowe insighty buduj na nowych nazwach.

## Mapowanie rename eventów

| Stara nazwa (PostHog) | Nowa nazwa (Syntance) | Uwagi |
|----------------------|----------------------|-------|
| `cart_add` | `add_to_cart` | GA4 recommended |
| `scroll_to_section` | `section_view` | custom |
| `category_view` | `view_item_list` | GA4 recommended |
| `cart_view` | `view_cart` | GA4 recommended |
| `form_submit` (wycena) | `lead_submit` | Meta → Lead |
| `lead_magnet_download` | `file_download` | custom Meta |
| `checkout_start` | `begin_checkout` | GA4 recommended |

## Purchase — nowy punkt emisji

**Przed:** `purchase` z `CheckoutForm` i `/checkout/przelewy24/return`.

**Po:** wyłącznie `/checkout/potwierdzenie` (`PurchaseTracking.tsx`).

- Meta Pixel: `eventID = purchase_{orderId}`
- Meta CAPI Purchase: server-side w subscriberze `order.placed` (ten sam `event_id`)
- Browser `/api/capi` **nie** przyjmuje `Purchase`

## Funnele do odtworzenia w PostHog EU

### F1 — Hero → CTA
1. `page_view` (path = `/`)
2. `cta_click` lub `section_view` (hero)
3. `lead_submit` / `contact_click`

### F2 — PLP → PDP → koszyk
1. `view_item_list`
2. `product_view`
3. `add_to_cart`
4. `view_cart`

### F4 — Checkout
1. `begin_checkout`
2. `form_step` (kroki 1–3)
3. `purchase` (thank-you page)

### F9 — Formularze lead
1. `lead_submit` (form_name)
2. `email_signup` (newsletter)

## Aktualizacja dashboardów PostHog (krok po kroku)

1. Zaloguj się do [PostHog EU](https://eu.posthog.com) → projekt storefront.
2. **Insights** → otwórz każdy wykres używający starych nazw (`cart_add`, `checkout_start`, …).
3. Zduplikuj insight (⋯ → Duplicate).
4. W filtrze eventu zamień starą nazwę na nową z tabeli powyżej.
5. Porównaj 7–14 dni overlap (stary vs nowy insight) — trend powinien być spójny.
6. Zaktualizuj **Dashboards** — podmień stare insighty na duplikaty z nowymi nazwami.
7. **Funnels** — przebuduj sekwencje według sekcji F1/F2/F4/F9.
8. **Recordings** — bez zmian (filtry po URL / properties).
9. Po weryfikacji usuń lub zarchiwizuj stare insighty (oznacz tagiem `legacy-pre-syntance`).

## Meta Events Manager

- Test Events: po pierwszym zamówieniu sprawdź kolumnę **Deduplicated** (Pixel + CAPI, ten sam `event_id`).
- Włącz CAPI dopiero po QA: `CAPI_ENABLED=true` (backend) + `NEXT_PUBLIC_CAPI_ENABLED=true` (storefront).

## Zmienne środowiskowe (prod)

**Vercel (storefront):** `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `CAPI_ENABLED`, `NEXT_PUBLIC_CAPI_ENABLED`, `CAPI_ALLOWED_ORIGINS`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

**Railway (Medusa worker):** `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `CAPI_ENABLED=true`, `POSTHOG_API_KEY` — subscriber `order.placed` wymaga async event bus (Redis).

## Decyzje architektoniczne (audyt prod)

### 1. RODO — server-side eventy bramkowane zgodą (consent snapshot)

Meta i PostHog to **współadministratorzy** danych. W EU/PL wysyłka server-side
wymaga **zgody**, nie „uzasadnionego interesu". Dlatego:

- Storefront zapisuje snapshot zgód do `cart.metadata` w `prepare-checkout`
  (PRZED `completeCart`): `consent_analytics`, `consent_marketing`,
  `ph_distinct_id`, `ph_session_id`.
- Medusa kopiuje `cart.metadata` → `order.metadata` przy domknięciu koszyka,
  więc subscriber `order.placed` widzi snapshot **bez race condition**.
- Subscriber bramkuje **fail-closed**:
  - Meta CAPI Purchase → tylko gdy `consent_marketing === "1"`,
  - PostHog `purchase` → tylko gdy `consent_analytics === "1"`.
- `meta-capi.ts` ma drugi bezpiecznik (`readAnalyticsConsent(order).marketing`).

Klucze i logika: `apps/backend/src/lib/analytics-consent-metadata.ts`.

### 2. PostHog purchase — wyłącznie server-side (anty-double-count)

`purchase` **nie jest** wysyłane do PostHog z klienta
(`POSTHOG_SERVER_ONLY_EVENTS` w `track.ts`). Źródłem prawdy jest subscriber:

- `distinct_id` = `ph_distinct_id` ze snapshotu (fallback: hash emaila → `order.id`).
  Dzięki temu lejek `begin_checkout` (klient) → `purchase` (serwer) łączy się
  w **jedną osobę** — inaczej server-side PostHog pokazałby 0% domknięcia.
- `$insert_id = purchase_{orderId}` → dedup przy retry subscribera.
- Kwoty w PLN (jednostki główne Medusa v2) — **bez `/100`**.

GA4 i Meta Pixel pozostają client-side (dedup Meta przez `event_id`).

### 3. GA4 purchase undercount — świadomie zaakceptowany

GA4 `purchase` jest **tylko client-side** (thank-you page). Część płatności
(P24) nie wraca na `/checkout/potwierdzenie`, więc GA4 **niedolicza** revenue.

**Decyzja:** akceptujemy. North Star przychodu liczymy z **Medusy** (prawda)
oraz **PostHog server** (komplet). GA4 = proxy ścieżki/akwizycji, nie kasa.
Jeśli kiedyś wejdzie Google Ads z licytacją wg wartości (Performance Max),
dorzucimy Measurement Protocol + `ga_client_id` do tego samego snapshotu.

### 4. Atrybucja i jakość danych

- **UTM**: first-touch (`lumine.utm.v1`, atrybucja źródła) + last-touch
  (`lumine.utm_last.v1`, źródło bieżącej wizyty) — oba w `withContext`.
- **Segment** (`beauty`/`edu`): GA4 user property (`setGA4UserSegment`) — wymiar
  dla wszystkich eventów, bez doklejania do każdego payloadu.
- **Kwoty**: `round2()` w `medusa-items.ts` eliminuje artefakty floata (groszе/100).
- **upsell_accepted**: `cross_sell_click` zapisuje atrybucję
  (`upsell-attribution.ts`, TTL 30 min), `add_to_cart` ją domyka.
