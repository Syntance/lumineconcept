import type { Metadata } from "next";
import { Suspense } from "react";
import { sanityClient } from "@/lib/sanity/client";
import { SITE_SETTINGS_QUERY } from "@/lib/sanity/queries";
import type { SiteSettings } from "@/lib/sanity/types";
import { buildMetadata } from "@/lib/sanity/metadata";
import { SITE_URL } from "@/lib/utils";
import { HeroSection } from "@/components/home/HeroSection";
import { SegmentCards } from "@/components/home/SegmentCards";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { FooterCTA } from "@/components/home/FooterCTA";
import { ReferralBanner } from "@/components/home/ReferralBanner";


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
    sameAs: [
      "https://www.instagram.com/lumineconcept/",
      "https://www.facebook.com/lumineconcept/",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      <Suspense fallback={null}>
        <ReferralBanner />
      </Suspense>

      {/* Sekcja 1: Hero + Trust bar */}
      <HeroSection />

      {/* Sekcja 2: Karty segmentowe + mini-galeria + trust bar + marka z twarzą */}
      <SegmentCards />

      {/* Sekcja 3: Social proof + 5 UVP ikon */}
      <SocialProofSection />

      {/* Sekcja 4: Footer CTA + IG feed */}
      <FooterCTA />

    </>
  );
}
