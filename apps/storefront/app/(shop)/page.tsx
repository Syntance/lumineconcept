import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteSettings } from "@/lib/sanity/client";
import { buildMetadata } from "@/lib/sanity/metadata";
import { SITE_URL } from "@/lib/utils";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeTrustMarquee } from "@/components/home/HomeTrustMarquee";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { FooterCTA } from "@/components/home/FooterCTA";
import { ReferralBanner } from "@/components/home/ReferralBanner";
import { BestsellersSection } from "@/components/home/BestsellersSection";


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return buildMetadata({
    seo: settings?.seo ?? undefined,
    fallbackTitle:
      "Lumine Concept \u2014 branding z plexi dla salon\u00f3w beauty | Logo 3D, cenniki, oznaczenia",
    fallbackDescription:
      "Logo 3D, cenniki i oznaczenia z plexi. Matowe UV, LED z pilotem, 15+ kolor\u00f3w. Express 72h. 6 000+ realizacji. Wy\u015blij logo \u2014 wycena w 24h.",
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
    description: "Logo 3D, cenniki i oznaczenia z plexi dla salon\u00f3w beauty. Matowe UV, LED z pilotem, 15+ kolor\u00f3w.",
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
      target: `${SITE_URL}/sklep?q={search_term_string}`,
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

      <HeroSection>
        <Suspense fallback={null}>
          <HomeTrustMarquee />
        </Suspense>
      </HeroSection>

      <Suspense fallback={null}>
        <BestsellersSection />
      </Suspense>

      <SocialProofSection />

      <Suspense fallback={null}>
        <FooterCTA />
      </Suspense>
    </>
  );
}
