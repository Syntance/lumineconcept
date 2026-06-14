# CMS Hybrid Sync (tekst live + obrazy static)

## Model

| Typ zmiany | Publikacja | Czas na prod |
|------------|------------|--------------|
| Tekst, SEO, linki, FAQ, trust bar, announcement | `revalidateTag('magazyn-content')` + webhook | sekundy |
| Obrazy (hero, galerie, OG, logotypy, Instagram) | **ręczny Redeploy** w panelu CMS/SEO → deploy hook → prebuild | ~2–3 min |

**Runtime:** storefront czyta treść **live** z Medusa, ale **nowe zdalne URL-e obrazów**
(poza mapą z ostatniego prebuildu) są **ukrywane** do ręcznego Redeploy — nie widać ich z R2 od razu po zapisie.
Po redeploy mapa zawiera nowe wpisy → obrazy serwowane lokalnie z `/images/cms/…`.

## Flow zapisu w panelu

```
Edycja w Magazyn → Zapisz
        │
        └─ revalidateTag + webhook → tekst live od razu (bez redeploy)

Edycja zdjęć → Zapisz (URL w Medusa) → opcjonalnie wiele zapisów
        │
        └─ gdy gotowe: przycisk „Redeploy” w CMS / SEO
              └─ deploy hook (VERCEL_DEPLOY_HOOK_URL)
                    └─ prebuild: sync-cms-to-static.ts
                          ├─ download obrazów → public/images/cms/
                          └─ generate static-cms-media-map.ts
                                └─ next build → prod
```

Upload obrazu **nie** uruchamia deployu — tylko zapis formularza + późniejszy Redeploy.

## Prebuild (`scripts/sync-cms-to-static.ts`)

Uruchamiany w `prebuild` (prod build):

1. Auth do Medusa (`MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD`)
2. Fetch `Store.metadata` (settings, pages, global)
3. Download wszystkich URL-i CMS media → `/public/images/cms/`
4. Generuje `lib/content/static-cms-media-map.ts` (CDN URL → lokalna ścieżka)

Plik `static-cms-content.ts` jest **deprecated** — pełny snapshot treści nie jest już
używany w runtime.

## Dev vs Prod

Ten sam model gate mediów wszędzie (localhost, preview, prod): **nieopublikowane** uploady CMS
(R2, `/static/`, Medusa) nie trafiają na storefront — tylko wpisy z mapy prebuild → `/images/cms/…`.

### Lokalnie (`pnpm dev`)
- Treść tekstowa live z Medusa (jak prod)
- Obrazy CMS: po zapisie w panelu **niewidoczne** na sklepie, dopóki nie zsyncujesz mediów:
  `pnpm exec tsx scripts/sync-cms-to-static.ts` (lub pełny `pnpm build`)
- Panel Magazyn nadal pokazuje podgląd z R2 (`resolveCmsAssetUrl ?? rawUrl`)

### Prod (`pnpm build` / Redeploy)
- `prebuild` → sync mediów + mapa URL
- Po Redeploy z panelu CMS — nowe obrazy w `/images/cms/`

## ENV

| Zmienna | Rola |
|---------|------|
| `MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD` | Odczyt CMS (runtime + prebuild) |
| `STOREFRONT_REVALIDATE_URL` + `MEDUSA_REVALIDATE_SECRET` | Webhook rewalidacji |
| `VERCEL_DEPLOY_HOOK_URL` | Deploy po zmianie mediów |
| `S3_FILE_URL` / `NEXT_PUBLIC_S3_FILE_URL` | Publiczne URL-e uploadów |

## Troubleshooting

### Tekst się nie aktualizuje
→ Sprawdź webhook `/api/revalidate/medusa` i tag `magazyn-content`.

### Obrazy stare / z CDN zamiast lokalnych
→ Sprawdź czy deploy hook poszedł po zapisie z obrazem; logi buildu prebuild.

### „Auth failed” w prebuild
→ Credentials Medusa w env buildu (Vercel).

### PageSpeed — nadal fetch do R2 na hero
→ Mapa mediów pusta lub sync nie zakończył się; `pnpm exec tsx scripts/sync-cms-to-static.ts` lokalnie.

## Pliki

- `scripts/sync-cms-to-static.ts` — prebuild sync
- `lib/content/index.ts` — live fetch + overlay mapy
- `lib/content/static-cms-media-map.ts` — generowana mapa (stub w repo)
- `lib/content/media-overlay.ts` — podmiana URL w blobie
- `lib/content/media-publish.ts` — wykrywanie zmian mediów przy zapisie
- `magazyn/modules/content/revalidate-content.ts` — hybrid revalidation
- `public/images/cms/` — pobrane obrazy (gitignored w prod flow)
