# Hero Image Optimization Guide

## Problem
Hero image jest elementem LCP (Largest Contentful Paint) i jego rozmiar bezpośrednio wpływa na wynik PageSpeed.

Obecny wynik: **LCP 5.0s** (czerwony)
Cel: **LCP < 2.5s** (zielony)

## Wymagania dla hero image

### Desktop (2560x966px)
- **Format:** WebP (zalecany) lub AVIF dla najlepszej kompresji
- **Jakość:** 75-85% (optymalna równowaga jakość/rozmiar)
- **Rozmiar docelowy:** < 150 KB
- **Obecny rozmiar:** sprawdź w `public/images/cms/`

### Mobile (1200x800px lub mniejszy)
- **Format:** WebP lub AVIF
- **Jakość:** 75-85%
- **Rozmiar docelowy:** < 80 KB

## Narzędzia do kompresji

### 1. Squoosh (zalecane - online)
https://squoosh.app/

**Ustawienia dla desktop:**
- Resize: 2560x966px (zachowaj proporcje)
- Format: WebP
- Quality: 80
- Effort: 6 (max quality)

**Ustawienia dla mobile:**
- Resize: 1200x800px lub 828x800px
- Format: WebP
- Quality: 80
- Effort: 6

### 2. ImageOptim (Mac)
https://imageoptim.com/

- Przeciągnij obraz do aplikacji
- Automatyczna optymalizacja WebP

### 3. Sharp CLI (command line)
```bash
# Instalacja
npm install -g sharp-cli

# Desktop
npx sharp -i hero-desktop.jpg -o hero-desktop.webp resize 2560 966 -- webp -Q 80

# Mobile
npx sharp -i hero-mobile.jpg -o hero-mobile.webp resize 1200 800 -- webp -Q 80
```

## Proces wdrożenia

1. **Zoptymalizuj obecny obraz:**
   - Pobierz obecny obraz z `public/images/cms/`
   - Użyj Squoosh lub Sharp CLI
   - Porównaj rozmiar (powinien być 50-70% mniejszy)

2. **Upload do CMS:**
   - Magazyn → CMS/SEO → strona Home
   - Upload nowego zoptymalizowanego obrazu
   - Zapisz

3. **Redeploy:**
   - Kliknij "Redeploy" w panelu CMS
   - Prebuild script ściągnie nowy obraz do `/public/images/cms/`

4. **Weryfikacja:**
   - Sprawdź w PageSpeed Insights
   - LCP powinien spaść do < 2.5s
   - Rozmiar obrazu w Network tab < 150 KB

## Checklist

- [ ] Obraz desktop zoptymalizowany (WebP, < 150 KB)
- [ ] Obraz mobile zoptymalizowany (WebP, < 80 KB)
- [ ] Upload do CMS
- [ ] Redeploy wykonany
- [ ] PageSpeed LCP < 2.5s

## Dodatkowe uwagi

- **Blur placeholder:** CMS generuje blur data URL automatycznie przy uploadu
- **Preload:** Dodany automatycznie w `app/(shop)/page.tsx`
- **Unoptimized:** Hero używa `unoptimized` bo serwujemy statyczny plik, kompresja jest na etapie uploadu do CMS
