import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/providers/Providers";
import { CookieConsent } from "@/components/common/CookieConsent";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/lib/sanity/types";
import "@/styles/globals.css";

const gilroy = localFont({
  src: [
    { path: "../public/fonts/Gilroy-Light.ttf", weight: "300", style: "normal" },
    { path: "../public/fonts/Gilroy-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Gilroy-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Gilroy-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Gilroy-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

const chronicle = localFont({
  src: [
    { path: "../public/fonts/ChronicleDisp-Light.otf", weight: "300", style: "normal" },
    { path: "../public/fonts/ChronicleDisp-Roman.otf", weight: "400", style: "normal" },
    { path: "../public/fonts/ChronicleDisp-Semibold.otf", weight: "600", style: "normal" },
    { path: "../public/fonts/ChronicleDisp-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-chronicle",
  display: "swap",
});

const binerka = localFont({
  src: "../public/fonts/Binerka.otf",
  weight: "400",
  variable: "--font-binerka",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumine.syntance.dev";

async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await sanityClient.fetch<SiteSettings>(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 300 } });
  } catch {
    return null;
  }
}

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
    "Produkty z plexi i rozwiązania brandingowe dla salonów beauty. Loga 3D, stojaki, organizery, tablice cennikowe i więcej.";
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
      <body className="min-h-screen overflow-x-hidden bg-white antialiased">
        <CookieConsent />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
