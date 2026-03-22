import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/providers/Providers";
import { CookieConsent } from "@/components/common/CookieConsent";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumine.syntance.dev",
  ),
  title: {
    default: "Lumine Concept — Plexi & Branding dla Salonów Beauty",
    template: "%s | Lumine Concept",
  },
  description:
    "Produkty z plexi i rozwiązania brandingowe dla salonów beauty. Loga 3D, stojaki, organizery, tablice cennikowe i więcej.",
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "Lumine Concept",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-white antialiased">
        <CookieConsent />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
