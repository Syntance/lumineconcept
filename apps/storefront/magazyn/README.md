# Moduł „Magazyn" + CMS — wzór do implementacji w nowych sklepach

Autorski panel administracyjny (zarządzanie sklepem, treściami, SEO, mailami)
**wbudowany w storefront Next.js** — bez osobnego CMS i bez Medusa Admin UI.
Dane trzyma w **Medusa** (produkty, zamówienia, konfigurator) oraz w
**`Store.metadata`** (treści/SEO/maile). Ten plik to przewodnik „jak wstawić ten
moduł do nowego sklepu/strony". Szczegóły per moduł: README w podkatalogach.

> Zasada nadrzędna: **`magazyn.config.ts` to JEDYNY plik, który edytujesz pod nowy
> sklep.** Sekrety idą do `.env.local`. Resztę kopiujesz 1:1.

---

## 1. Czym to jest

- **Panel** pod `/<basePath>` (domyślnie `/magazyn`) — login + pulpit + moduły.
- **Moduły** (włączane flagami): `products`, `orders`, `categories`, `content` (CMS),
  `emails`, `settings`.
- **CMS** = treści witryny w `Store.metadata` (hero, FAQ, opinie, trust bar,
  social, SEO per strona) — edytowane w panelu, renderowane przez RSC storefrontu.
- **Bez zewnętrznego CMS** (Sanity/Contentful niepotrzebne) i **bez Medusa Admin**.

## 2. Architektura

```
apps/storefront/
├── magazyn/
│   ├── magazyn.config.ts        # ⟵ JEDYNY plik per sklep (branding, basePath, moduły, ENV-less)
│   ├── core/                    # warstwa wspólna (ZAWSZE kopiujesz)
│   │   ├── config/types.ts      # kontrakt MagazynConfig
│   │   ├── env.ts               # serverEnv (ENV server-only)
│   │   ├── medusa/              # adminFetch / serviceAdminFetch / session / errors
│   │   ├── auth/                # login, allowlist, requireAdminSession, rate-limit, OAuth
│   │   ├── audit/               # recordAudit (audit trail)
│   │   ├── layout/              # panel-shell, nawigacja
│   │   └── ui/                  # prymitywy (Button, Input, ConfirmDialog…)
│   └── modules/                 # włączane wg magazyn.config.modules
│       ├── products/ orders/ categories/ content/ emails/ settings/
├── app/
│   ├── magazyn/                 # trasy panelu (/magazyn, /magazyn/panel/*)
│   └── ...                      # publiczny storefront czyta CMS przez lib/content
├── lib/content/                 # ODCZYT treści CMS (parsers, defaults, metadata, static sync)
└── middleware.ts                # bramka: cookie sesji na /<basePath>/panel/**
```

Warstwy README (czytaj przed kopiowaniem modułu):
[`core/`](core/README.md) · [`modules/content/`](modules/content/README.md) ·
[`modules/products/`](modules/products/README.md) · [`modules/orders/`](modules/orders/README.md) ·
[`modules/categories/`](modules/categories/README.md) · [`modules/emails/`](modules/emails/README.md)

## 3. Stack / zależności

- **Next.js 16 (App Router) + React 19**, TypeScript strict, Tailwind v4.
- **MedusaJS v2** (backend) — produkty, zamówienia, `Store.metadata`, Admin API.
- `zod` (walidacja), `@medusajs/js-sdk`, `lucide-react`, Radix, `@dnd-kit` (DnD kolejność).
- Integracje opcjonalne: **R2/S3** (uploady), **Resend** (maile), **Upstash Redis**
  (rate-limit/login), **Meilisearch** (search), **Sentry**, **PostHog**.

## 4. Krok po kroku — nowy sklep

1. **Skopiuj** katalogi: `magazyn/` (całość) + `app/magazyn/` + `lib/content/` +
   `middleware.ts`. Dla CMS na publicznych stronach: `components/content/` i miejsca
   użycia `getPageContent`/`getSiteSettings`.
2. **Alias** w `tsconfig.json`: `"@magazyn/*": ["./magazyn/*"]` (oraz `"@/*": ["./*"]`).
3. **Edytuj `magazyn.config.ts`** (patrz §5) — branding, `basePath`, `auth.cookieName`,
   `modules`, `content.pages` / `globalBlocks`, dane firmy (bankTransfer), motyw maili.
4. **Ustaw ENV** (`.env.local` storefront + backend) — patrz §6.
5. **Konto admina Medusy** + wpisz e-maile do `MAGAZYN_ADMIN_ALLOWLIST`.
6. **Trasy publiczne**: podłącz CMS w sekcjach (`await getPageContent("home")` itp.).
7. **Weryfikacja**: `pnpm type-check && pnpm lint && pnpm test`, wejdź na `/<basePath>`,
   zaloguj się, sprawdź każdy włączony moduł.

## 5. `magazyn.config.ts` — kontrakt (jedyny plik per sklep)

Pełny typ: [`core/config/types.ts`](core/config/types.ts). Najważniejsze pola:

| Pole | Rola |
| --- | --- |
| `basePath` | Prefiks panelu, np. `/magazyn` (musi zgadzać się z matcherem `middleware.ts`) |
| `branding` | Nazwa, tytuł panelu, `storefrontUrl` |
| `auth.cookieName` | Nazwa cookie sesji (unikalna per sklep) |
| `auth.google` | Włącz logowanie Google (wymaga providera w Medusie) |
| `modules` | Flagi włączonych modułów |
| `content.pages` / `content.globalBlocks` | Model treści CMS (jakie strony/bloki edytowalne) |
| `bankTransfer` | Dane do przelewu (NAP) — używane w mailach i `LocalBusiness` |
| `email`, `emailTheme` | Nadawca + motyw maili transakcyjnych |
| `currency`, `locale` | `pln`, `pl-PL` |

> `magazyn.config.ts` **nie zawiera sekretów** — tylko branding/teksty/struktura.

## 6. ENV — macierz

**Storefront** (`.env.local`):

| Zmienna | Po co |
| --- | --- |
| `MEDUSA_BACKEND_URL` / `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL backendu Medusy |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Klucz Store API |
| `MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD` | Konto serwisowe (cache'owany odczyt `Store.metadata`) |
| `MAGAZYN_ADMIN_ALLOWLIST` | CSV e-maili dopuszczonych do panelu (gdy puste = bez ograniczenia) |
| `NEXT_PUBLIC_SITE_URL` | Kanoniczny URL (SEO, OAuth callback) |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate-limit logowania (fail-open bez nich) |
| `S3_FILE_URL` / `NEXT_PUBLIC_S3_FILE_URL` | Publiczna baza R2 (next/image, CSP) |
| `ORDER_EMAIL_INTERNAL_SECRET` (lub `MEDUSA_REVALIDATE_SECRET`) | Sekret wewn. (maile, rewalidacja) |
| `VERCEL_DEPLOY_HOOK_URL` | Auto-deploy po publikacji CMS (tryb static) |

**Backend Medusa** (`apps/backend/.env`):

| Zmienna | Po co |
| --- | --- |
| `S3_ENDPOINT/_BUCKET/_ACCESS_KEY_ID/_SECRET_ACCESS_KEY` | R2 (uploady + backup) |
| `STOREFRONT_REVALIDATE_URL` + `MEDUSA_REVALIDATE_SECRET` | Webhook rewalidacji storefrontu |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Globalny rate-limit `/store/custom/*` |
| `BACKUP_ENCRYPTION_KEY` / `BACKUP_RETENTION_DAYS` / `BACKUP_PGDUMP` | DR (patrz `docs/runbooks/dr-restore.md`) |
| `RESEND_API_KEY` | Maile transakcyjne |

## 7. Przechowywanie danych (CMS)

Treści w `Store.metadata` (1 odczyt cache'owany na render): `magazyn_site_settings`,
`magazyn_page_seo`, `magazyn_page_content`, `magazyn_global_content`. Produkty:
`product.metadata` (`seo_*`, `product_faq`, konfigurator). Szczegóły:
[`modules/content/README.md`](modules/content/README.md).

## 8. Bezpieczeństwo (checklist wdrożenia)

- [ ] `middleware.ts` chroni `/<basePath>/panel/**` (matcher = `basePath`).
- [ ] `MAGAZYN_ADMIN_ALLOWLIST` ustawione na produkcji.
- [ ] Każda Server Action mutująca: walidacja `zod` + `adminFetch`/`requireAdminSession`.
- [ ] Uploady i wysyłki maili: `requireAdminSession()` (nie tylko obecność cookie).
- [ ] Operacje destrukcyjne: `ConfirmDialog` + `recordAudit(...)`.
- [ ] Sekrety wyłącznie server-side (`core/env.ts`), nigdy `NEXT_PUBLIC_*`.
- [ ] Zapisy do `Store.metadata`: **read-modify-write** (nie nadpisuj całego blobu).
- [ ] Linki z CMS sanityzowane (`parsers.ts` — blok `javascript:`/`data:`).

Reguły maszynowe: [`.cursor/rules/magazyn-panel.mdc`](../../../.cursor/rules/magazyn-panel.mdc),
[`.cursor/rules/cms-content.mdc`](../../../.cursor/rules/cms-content.mdc).

## 9. Wydajność

- Prod: snapshot CMS w buildzie (`scripts/sync-cms-to-static.ts`) → zero fetchy w runtime.
- Dev/fallback: 1 cache'owany fetch `Store.metadata` (`lib/content/admin-read.ts`, tag
  `magazyn-content`).
- Po zapisie: `revalidateTag('magazyn-content')` + webhook + (tryb static) deploy hook.
- Wszystkie fetch do Medusy z `AbortSignal.timeout`/`withMedusaTimeout`.

## 10. Niezawodność / DR

Backup danych do R2 (szyfrowany), retencja, restore: `pnpm --filter @lumine/backend
restore:verify`. Pełny runbook: [`docs/runbooks/dr-restore.md`](../../../docs/runbooks/dr-restore.md).

## 11. Pre-merge

```bash
pnpm type-check && pnpm lint && pnpm test
# zmiany w checkout/koszyku: dodatkowo pnpm test:e2e
```

## 12. Przeniesienie do repo `moduly` (template)

Repo `moduly` to katalog wzorcowy. Aby moduł był „skonstruowany tak samo":
1. Skopiuj `magazyn/` + `app/magazyn/` + `lib/content/` + `middleware.ts` jako pakiet
   wzorcowy (zachowaj strukturę katalogów).
2. W pakiecie wzorcowym zostaw `magazyn.config.ts` jako **przykład** z komentarzami
   „edytuj pod nowy sklep" (bez realnych danych firmy/IBAN).
3. Dołącz ten `README.md` + per-moduł README + obie reguły `.cursor/rules/*.mdc`.
4. Sekrety: wyłącznie w `.env.example` (nazwy, nie wartości).
