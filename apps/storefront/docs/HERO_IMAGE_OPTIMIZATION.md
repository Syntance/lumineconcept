# Hero Image Optimization Guide

## Rozwiązanie

Hero images używają **Next.js Image Optimization**:
- Automatyczne generowanie responsive srcset (różne rozmiary dla mobile/desktop/tablet)
- Automatyczna konwersja do AVIF/WebP
- Downskalowanie do rzeczywistego rozmiaru viewport
- Cache 1 rok na CDN Vercel

**Mobile ściąga ~1080px zamiast desktop 2560px** — redukcja rozmiaru ~70%.

## Status mobile (PageSpeed)

Przed optymalizacją:
- **LCP:** 1.5s (czerwony)
- **Rozmiar obrazu:** 648 KB (szacunkowa redukcja: 565 KB)

Po optymalizacji (oczekiwane):
- **LCP:** < 1.2s (zielony)
- **Rozmiar obrazu mobile:** ~150-200 KB (srcset 1080px + WebP)
- **Rozmiar obrazu desktop:** ~300-400 KB (srcset 1920-2560px + WebP)

## Jak działa

1. **Upload do CMS:** Prześlij wysokiej jakości obraz źródłowy (nawet 2-3 MB, JPEG/PNG/WebP)
2. **Prebuild:** Script `sync-cms-to-static` kopiuje do `/public/images/cms/`
3. **Build-time:** Next.js generuje optymalne srcset dla wszystkich device sizes
4. **Runtime:** Vercel Image Optimization serwuje AVIF/WebP z cache

**Nie musisz ręcznie kompresować obrazów** — Next.js robi to automatycznie.

## Zalecenia dla źródłowych obrazów

Dla najlepszej jakości końcowej, upload do CMS:

### Desktop (źródło)
- **Rozdzielczość:** 2560×966px lub większa
- **Format:** JPEG, PNG lub WebP
- **Jakość:** Wysoka (90-100%)
- **Rozmiar:** Bez ograniczeń (Next.js zoptymalizuje)

### Mobile (źródło, opcjonalnie)
- **Rozdzielczość:** 1350×1688px lub większa (proporcja 4:5)
- **Format:** Dowolny
- **Jakość:** Wysoka

## Proces wdrożenia nowego hero

1. **Upload do CMS:**
   - Magazyn → CMS/SEO → strona Home
   - Upload obrazu desktop (i opcjonalnie mobile)
   - Zapisz
   
2. **Redeploy:**
   - Kliknij "Redeploy" w panelu CMS
   - Prebuild script ściągnie obrazy do `/public/images/cms/`
   - Next.js wygeneruje optymalne srcset

3. **Weryfikacja:**
   - Sprawdź w PageSpeed Insights
   - Mobile LCP powinien spaść do < 1.2s
   - Network tab: srcset dla mobile ~1080px, desktop ~1920-2560px

## Troubleshooting

### "Obraz nadal za duży na mobile"
- Sprawdź czy Next.js Optimization działa (Network tab → powinien być srcset)
- Sprawdź czy `unoptimized` nie jest hardcodowane w komponencie

### "Brak obrazu po Redeploy"
- Sprawdź logi prebuild (`pnpm prebuild` lokalnie)
- Sprawdź czy obrazy są w `public/images/cms/`

### "Obraz rozmyty"
- Obraz źródłowy za mały — prześlij wyższą rozdzielczość
- Next.js ogranicza się do rozdzielczości źródła

