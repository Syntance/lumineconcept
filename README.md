# Lumine Commerce

Produkcyjny sklep e-commerce dla **Lumine Concept** — produkty z plexi i branding dla salonów beauty.

**Stack:** Next.js 15 + MedusaJS v2 + Sanity.io | Monorepo (Turborepo + pnpm)

## Architektura

```
apps/storefront   → Next.js 15 (App Router, SSR/ISR, Server Components)
apps/backend      → MedusaJS v2 (API-first e-commerce)
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
- **Sanity Studio:** `cd sanity && pnpm dev`

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
| **CookieYes** | RODO cookie consent | Script w `CookieConsent.tsx` |

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
pnpm lint         # Lintowanie
pnpm type-check   # Sprawdzanie typów
pnpm docker:up    # Uruchom Docker (DB, Redis, Meilisearch)
pnpm docker:down  # Zatrzymaj Docker
```

## Licencja

Projekt prywatny — Lumine Concept © 2026
