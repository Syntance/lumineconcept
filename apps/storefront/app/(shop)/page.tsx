import type { Metadata } from "next";
import { Suspense } from "react";
import { getPageContent, getPageSeo, getSiteSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/content/metadata";
import { SITE_URL } from "@/lib/utils";
import { HeroSection } from "@/components/home/HeroSection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { FooterCTA } from "@/components/home/FooterCTA";
import { ReferralBanner } from "@/components/home/ReferralBanner";
import { BestsellersSection } from "@/components/home/BestsellersSection";


export async function generateMetadata(): Promise<Metadata> {
  const [pageSeo, settings] = await Promise.all([getPageSeo("home"), getSiteSettings()]);

  return buildMetadata({
    seo: pageSeo ?? settings?.seo ?? undefined,
    fallbackTitle:
      "Lumine Concept \u2014 branding z plexi dla salon\u00f3w beauty | Tablice z logo, cenniki, oznaczenia",
    fallbackDescription:
      "Tablice z logo, cenniki i oznaczenia z plexi. Matowe UV, LED z pilotem, 15+ kolor\u00f3w. Express 72h. 6 000+ realizacji. Wy\u015blij logo \u2014 wycena w 24h.",
    siteSettings: settings,
    path: "/",
  });
}

/** Dłuższy ISR — mniejszy TTFB na cold request (PageSpeed, pierwsze wejście). */
export const revalidate = 3600;

export default async function HomePage() {
  const pageContent = await getPageContent("home");
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lumine Concept",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`,
    description: "Produkty z plexi: tablice z logo Twojej marki, cenniki i oznaczenia w technice 3D. Matowe UV, LED z pilotem, 15+ kolor\u00f3w.",
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

      <HeroSection hero={pageContent.hero} />

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
