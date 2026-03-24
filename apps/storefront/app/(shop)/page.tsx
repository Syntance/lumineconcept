import type { Metadata } from "next";
import { Suspense } from "react";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/lib/sanity/types";
import { buildMetadata } from "@/lib/sanity/metadata";
import { SITE_URL } from "@/lib/utils";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeTrustMarquee } from "@/components/home/HomeTrustMarquee";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { FooterCTA } from "@/components/home/FooterCTA";
import { ReferralBanner } from "@/components/home/ReferralBanner";
import { BestsellersSection } from "@/components/home/BestsellersSection";


export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityClient
    .fetch<SiteSettings>(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 300 } })
    .catch(() => null);

  return buildMetadata({
    seo: settings?.seo ?? undefined,
    fallbackTitle:
      "Lumine Concept — branding z plexi dla salonów beauty | Logo 3D, cenniki, oznaczenia",
    fallbackDescription:
      "Logo 3D, cenniki i oznaczenia z plexi. Matowe UV, LED z pilotem, 15+ kolorów. Express 72h. 6 000+ realizacji. Wyślij logo — wycena w 24h.",
    siteSettings: settings,
    path: "/",
  });
}

export const revalidate = 60;

export default function HomePage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lumine Concept",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description: "Logo 3D, cenniki i oznaczenia z plexi dla salonów beauty. Matowe UV, LED z pilotem, 15+ kolorów.",
    sameAs: [
      "https://www.instagram.com/lumineconcept/",
      "https://www.facebook.com/lumineconcept/",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lumine Concept",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/produkty?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <Suspense fallback={null}>
        <ReferralBanner />
      </Suspense>

      {/* Sekcja 1: Hero */}
      <HeroSection />

      {/* Karuzela „Zaufały nam” (tło krem brand-50) */}
      <HomeTrustMarquee />

      {/* Sekcja 2: sygnet + Bestsellery (krem #EEE8E0) */}
      <Suspense fallback={null}>
        <BestsellersSection />
      </Suspense>

      {/* Sekcja 3: UVP + opinia klientki */}
      <SocialProofSection />

      {/* Sekcja 4: Footer CTA + IG feed */}
      <FooterCTA />

    </>
  );
}
