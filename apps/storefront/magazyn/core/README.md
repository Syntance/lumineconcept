# Rdzeń (`core/`)

Wspólna warstwa wszystkich modułów. Kopiujesz **zawsze** razem z dowolnym modułem.

| Ścieżka | Rola |
| --- | --- |
| `config/types.ts` | Typy `MagazynConfig` (kontrakt `magazyn.config.ts`) |
| `env.ts` | Dostęp do ENV po stronie serwera (`serverEnv`) |
| `medusa/client.ts` | Klient Medusa Admin: `adminFetch`, `serviceAdminFetch`, `adminUpload`, login |
| `medusa/session.ts` | Cookie sesji (nazwa z `auth.cookieName`) |
| `medusa/errors.ts` | `AdminUnauthorizedError`, `AdminApiError` |
| `medusa/media-url.ts` | Normalizacja URL mediów Medusa |
| `auth/actions.ts` | Server Actions: login email, logout, Google |
| `auth/load.ts` | `loadAdmin` — wrapper SSR z przekierowaniem na login |
| `auth/login-page.tsx`, `login-form.tsx` | Ekran logowania |
| `auth/logout-route.ts`, `google-callback-route.ts` | Route handlers auth |
| `ui/` | Prymitywy: `Button`, `Input`, `CheckboxInput`, `cn` (bez zewn. zależności UI) |
| `lib/` | `format` (ceny/daty), `slug` |
| `layout/panel-shell.tsx` | Powłoka panelu (sidebar + treść), chroni trasy |
| `layout/sidebar-nav.tsx`, `nav-items.ts` | Nawigacja z włączonych modułów |
| `layout/overview-page.tsx` | Pulpit (kafle modułów) |
| `styles/theme.css` | Tokeny kolorów / radius (jedyne miejsce z paletą panelu) |

## Konwencje importów

- Cross-cutting: alias `@magazyn/*` (ustaw w `tsconfig.json`).
- Wewnątrz modułu: importy względne (`./store`, `./actions`).

## Zależność od `magazyn.config.ts`

`core` i moduły czytają konfigurację z `@magazyn/magazyn.config`. To plik bez sekretów —
sekrety (klucze, hasła) trzymaj w `.env.local`.
