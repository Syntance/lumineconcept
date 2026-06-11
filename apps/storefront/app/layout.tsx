import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/providers/Providers";
import { CookieConsent } from "@/components/common/CookieConsent";
import { getSiteSettings } from "@/lib/sanity/client";
import "@/styles/globals.css";

/**
 * Ograniczamy liczbę ładowanych wag — każdy plik to osobne ~200kB.
 * Gilroy (body) zostaje jako `swap` (critical path), bez wagi 300 (nieużywana).
 * Chronicle (display) i Binerka (dekoracja) dostają `optional`: jeśli nie
 * załadują się w ~100ms, przeglądarka zostaje na fallbacku — brak FOIT/CLS.
 */
const gilroy = localFont({
  src: [
    { path: "../public/fonts/Gilroy-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Gilroy-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Gilroy-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
});

const chronicle = localFont({
  src: [
    { path: "../public/fonts/ChronicleDisp-Roman.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-chronicle",
  display: "optional",
  preload: false,
});

const binerka = localFont({
  src: "../public/fonts/Binerka.woff2",
  weight: "400",
  variable: "--font-binerka",
  display: "optional",
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
    settings?.seo?.ogImage?.asset?.url ||
    settings?.defaultOgImage?.asset?.url;
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${gilroy.variable} ${chronicle.variable} ${binerka.variable}`}>
      <head>
        {/* Mobile LCP: statyczny hero z /public (unoptimized) — jeden poprawny
            preload z media query. Desktop hero ładuje się lazy (hidden na mobile).
            Nie preloaduj fontów ani desktopowego hero — dublowało ~222 KB pasa. */}
        <link
          rel="preload"
          as="image"
          href="/images/hero-main-wall-mobile.webp"
          media="(max-width: 1023px)"
          fetchPriority="high"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-white antialiased">
        <CookieConsent />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
