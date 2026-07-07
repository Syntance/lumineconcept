import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import { Providers } from "@/providers/Providers";
import { CookieConsent } from "@/components/common/CookieConsent";
import { ConsentModeScript } from "@/components/analytics/ConsentModeScript";
import { PreviewOverlayGate } from "@/components/cms-preview/PreviewOverlayGate";
import { getSiteSettings } from "@/lib/content";
import "@/styles/globals.css";

/**
 * Fonty brandowe — `display: "swap"` + `adjustFontFallback` minimalizuje CLS
 * (metryki fallbacku dopasowane do fontu właściwego → reflow praktycznie zerowy).
 * - Gilroy (body + podtytuł hero): `swap`, preload na krytycznej ścieżce.
 * - Chronicle (nagłówki h1-h3 poniżej fold): `preload: false` — lazy load.
 *   Zaoszczędzane 32 KiB w oknie LCP konkurencji (fonty High + hero AVIF).
 *   Swap display zapobiega FOIT (unstyled text) — nagłówki sekcji poniżej fold
 *   mogą chwilę czekać bez wpływu na percepcję FCP/LCP.
 * - Binerka (nagłówek hero „CONCEPT"): `swap` + `preload: true` — nad linią zgięcia.
 * - 2 wagi Gilroy (400, 500) — waga 700 syntezowana z fallbacku.
 */
const gilroy = localFont({
  src: [
    { path: "../public/fonts/Gilroy-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Gilroy-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const chronicle = localFont({
  src: [
    { path: "../public/fonts/ChronicleDisp-Roman.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-chronicle",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ['Georgia', 'serif'],
  preload: false,
});

const binerka = localFont({
  src: "../public/fonts/Binerka.woff2",
  weight: "400",
  variable: "--font-binerka",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ['Georgia', 'serif'],
  preload: true,
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumineconcept.pl";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#725750",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  const title = settings?.seo?.metaTitle || settings?.title || "Lumine Concept — Plexi & Branding dla Salonów Beauty";
  const description =
    settings?.seo?.metaDescription ||
    settings?.description ||
    "Produkty z plexi i rozwiązania brandingowe dla salonów beauty. Tablice z logo, stojaki, organizery, tablice cennikowe i więcej.";
  const ogImageUrl =
    settings?.seo?.ogImageUrl ||
    settings?.defaultOgImageUrl;
  const titleTemplate = settings?.titleTemplate || "%s | Lumine Concept";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: titleTemplate,
    },
    description,
    openGraph: {
      type: "website",
      locale: "pl_PL",
      siteName: settings?.title || "Lumine Concept",
      url: SITE_URL,
      ...(ogImageUrl ? { images: [{ url: ogImageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
    },
    alternates: {
      canonical: SITE_URL,
    },
    ...(settings?.googleSiteVerification
      ? { verification: { google: settings.googleSiteVerification } }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="pl" className={`${gilroy.variable} ${chronicle.variable} ${binerka.variable}`}>
      <head>
        {/* Hero preload AVIF — HeroSection (RSC hoist do <head>). */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <ConsentModeScript nonce={nonce} />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-white antialiased">
        <CookieConsent />
        <Providers>{children}</Providers>
        <PreviewOverlayGate />
      </body>
    </html>
  );
}
