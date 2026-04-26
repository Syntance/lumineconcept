# Lumine Commerce

Produkcyjny sklep e-commerce dla **Lumine Concept** — produkty z plexi i branding dla salonów beauty.

**Stack:** Next.js 16 + MedusaJS v2 + Sanity.io | Monorepo (Turborepo + pnpm)

## Architektura

```
apps/storefront   → Next.js 16 (App Router, SSR/ISR, Server Components, Sentry)
apps/backend      → MedusaJS v2 (API-first e-commerce, Sentry)
sanity/           → Sanity Studio (CMS: blog, landing pages, FAQ)
packages/types    → Współdzielone typy TypeScript
packages/ui       → Współdzielone utilities UI
```

## Szybki start

### Wymagania

- Node.js 20+
- pnpm 9+
- Docker (dla lokalnego PostgreSQL, Redis, Meilisearch)

### 1. Instalacja zależności

```bash
pnpm install
```

### 2. Konfiguracja środowiska

```bash
cp apps/storefront/.env.local.example apps/storefront/.env.local
cp apps/backend/.env.example apps/backend/.env
```

Uzupełnij klucze API w plikach `.env`.

**Storefront + Medusa:** w `apps/storefront/.env.local` ustaw `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (Medusa Admin → Settings → Publishable API keys) i **tę samą wartość** w `MEDUSA_PUBLISHABLE_KEY`. Opcjonalnie `MEDUSA_BACKEND_URL` = ten sam URL co `NEXT_PUBLIC_MEDUSA_BACKEND_URL` (proxy `/api/medusa`). Przy backendzie lokalnym (`http://localhost:9000`) użyj klucza z lokalnej bazy, nie z produkcji.

### 3. Uruchomienie infrastruktury (Docker)

```bash
pnpm docker:up
```

Uruchamia PostgreSQL (5432), Redis (6379) i Meilisearch (7700).

### 4. Migracja bazy danych

```bash
cd apps/backend
pnpm db:migrate
```

> W produkcji (Railway) migracje odpala `preDeployCommand` z `railway.json`,
> a nie `CMD` kontenera — dzięki temu nie ma wyścigu przy wielu replikach.

### 4a. Bootstrap dostawy i płatności

Jednorazowo po migracji (idempotentne, można wołać przy każdym deployu):

```bash
pnpm --filter @lumine/backend setup-shipping   # DPD + manual, strefa PL
pnpm --filter @lumine/backend setup-payment    # pp_system_default w regionach
```

Na produkcji są też endpointy publiczne: `POST /store/custom/ensure-shipping`
i `POST /store/custom/ensure-payment` — storefront wywołuje je leniwie,
gdy widzi pustą listę.

### 4b. Konto admina na testy (lokalnie)

Jednorazowo po migracji (słabe hasło — wyłącznie do dev):

```bash
pnpm admin:create-local
```

**Logowanie:** http://localhost:7001 — e-mail `admin@local.test`, hasło `admin`.  
Jeśli użytkownik już istnieje, komenda zwróci błąd; wtedy zaloguj się tymi danymi albo usuń użytkownika z bazy i uruchom ponownie.

Wartości możesz też trzymać w `apps/backend/.env` jako `MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD` (wzór w `.env.example`).

### 5. Uruchomienie projektu

```bash
pnpm dev
```

- **Storefront:** http://localhost:3000
- **Medusa Backend:** http://localhost:9000
- **Medusa Admin:** http://localhost:7001
- **Meilisearch:** http://localhost:7700
- **Sanity Studio:** http://localhost:3335 (`pnpm dev` z roota uruchamia studio na tym porcie)

## Integracje

| Usługa | Cel | Konfiguracja |
|--------|-----|-------------|
| **Przelewy24** | Płatności (BLIK, przelewy, karty) | `PRZELEWY24_*` w `.env` |
| **PayPo** | Płatności odroczone (30 dni) | `PAYPO_*` w `.env` |
| **InPost** | Paczkomaty + kurier | `INPOST_*` w `.env` |
| **DPD** | Kurier backup | `DPD_*` w `.env` |
| **Cloudinary** | CDN zdjęć, optymalizacja | `CLOUDINARY_*` w `.env` |
| **Meilisearch** | Instant search + filtry | `MEILISEARCH_*` w `.env` |
| **Sanity.io** | CMS (blog, landing pages) | `SANITY_*` w `.env` |
| **PostHog** | Analityka behawioralna (eventy, funnele, session recordings, heatmapy) | `POSTHOG_*` w `.env` |
| **Meta Pixel + CAPI** | Remarketing FB/IG | `META_*` w `.env` |
| **MailerLite** | Email marketing | `MAILERLITE_*` w `.env` |
| **Resend** | Maile transakcyjne (potwierdzenie zamówienia, wysyłka, anulowanie) | `RESEND_API_KEY`, `RESEND_FROM` w `apps/backend/.env` — szczegóły w `.env.example` |
| **CookieYes** | RODO cookie consent | Script w `CookieConsent.tsx` |

### Maile po złożeniu zamówienia (Resend)

1. Utwórz klucz API w [Resend](https://resend.com/api-keys) i ustaw `RESEND_API_KEY` w środowisku **backendu** (lokalnie `apps/backend/.env`, na produkcji Railway). Domyślny nadawca w kodzie to `Lumine Concept <kontakt@lumineconcept.pl>` — nadpisz `RESEND_FROM` tylko jeśli potrzebujesz innego adresu z tej samej domeny.
2. **Domena:** w Resend → Domains zweryfikuj `lumineconcept.pl` (SPF/DKIM). Bez tego wysyłka z `kontakt@…` się nie uda. **Dev bez domeny:** ustaw `RESEND_FROM=Acme <onboarding@resend.dev>`.
3. Backend musi startować z ustawionym kluczem — wtedy ładuje się moduł `@medusajs/medusa/notification` z providerem `notification-resend`. Wysyłka uruchamia się przy evencie `order.placed` oraz przez zapasowy endpoint `notify-order-placed` wołany ze storefrontu po `completeCart`.
4. Na Railway worker Redis musi być ten sam deployment co API (`medusa start`), inaczej eventy z kolejki mogą nie zrealizować subscribera — wtedy nadal działa kanał HTTP ze sklepu.

## Deploy

| Komponent | Hosting |
|-----------|---------|
| Storefront (Next.js) | Vercel |
| Backend (MedusaJS) | Railway / DigitalOcean |
| Baza danych | Neon PostgreSQL |
| Cache / Kolejki | Upstash Redis |
| CMS | Sanity.io (cloud) |
| Zdjęcia | Cloudinary CDN |
| Wyszukiwarka | Meilisearch Cloud |

## Komendy

```bash
pnpm dev          # Uruchom wszystko w trybie dev
pnpm build        # Build produkcyjny
pnpm lint         # ESLint flat config — storefront, backend, packages
pnpm type-check   # tsc --noEmit w każdej paczce
pnpm test         # Vitest (jednostkowe) w storefront
pnpm test:e2e     # Playwright — wymaga działającego storefrontu + Medusy
pnpm docker:up    # Uruchom Docker (DB, Redis, Meilisearch)
pnpm docker:down  # Zatrzymaj Docker
```

## Testy

- **Jednostkowe (Vitest):** `pnpm test` lub per-paczka `pnpm --filter @lumine/storefront test`.
  Pokrywają `lib/medusa/checkout.ts` (retry, error mapping) i `CartProvider`
  (tworzenie koszyka, usuwanie pozycji, `lumine_express`).
- **End-to-end (Playwright):** `pnpm test:e2e`. Pierwsze uruchomienie wymaga
  `pnpm --filter @lumine/storefront test:e2e:install` (pobiera Chromium).
  Testy startują własny dev-server lub można skierować je na deployed
  preview przez `PLAYWRIGHT_BASE_URL=https://... pnpm test:e2e`.

## Observability — Sentry

Zarówno storefront (browser + edge + Node) jak i backend Medusy mają
opcjonalną integrację z Sentry. Brak `SENTRY_DSN` = kod jest no-op, nic
nie wysyłamy. Szczegóły w `.env.example`.

Wszystkie eventy przechodzą przez `scrub.ts` — czyścimy PII (`email`,
`phone`, `address`, `postal_code`, `ip_address`, ciasteczka, nagłówki
autoryzacji) zanim cokolwiek opuści serwer.

## CI / CD

- **CI (GitHub Actions):** `.github/workflows/ci.yml` odpala na każdy PR
  do `main` — install, lint, type-check, Vitest.
- **Backend:** Railway z `preDeployCommand: pnpm medusa db:migrate` — migracje
  przed deployem nowej rewizji, nie w kontenerze.
- **Storefront:** Vercel. Cache Next.js rewaliduje się webhookiem
  `POST /api/revalidate/medusa` (wołany z subscribera `product-revalidate`
  po `product.created|updated|deleted`).

## Licencja

Projekt prywatny — Lumine Concept © 2026
