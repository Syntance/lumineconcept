import type { Metadata } from "next";
import { Suspense } from "react";
import { getPageSeo, getSiteSettings } from "@/lib/content";
import { resolveSocialLinks } from "@/lib/content/cms-wiring";
import { buildMetadata } from "@/lib/content/metadata";
import {
  ORGANIZATION_ID,
  ORGANIZATION_KNOWS_ABOUT,
  ORGANIZATION_POSTAL_ADDRESS,
} from "@/lib/geo/organization";
import { resolveSocialSameAs } from "@/lib/social-links";
import { SITE_CONTACT } from "@/lib/site-contact";
import { SITE_URL } from "@/lib/utils";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { getPageSections } from "@/lib/content/sections";
import { SectionRenderer } from "@/components/composer/SectionRenderer";
import { ReferralBanner } from "@/components/home/ReferralBanner";


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
export const revalidate = 60;

export default async function HomePage() {
  const [sections, settings] = await Promise.all([getPageSections("home"), getSiteSettings()]);
  const socialSameAs = resolveSocialSameAs(resolveSocialLinks(settings));
  
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Lumine Concept",
    legalName: "Lumine Concept",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/logo.png`,
    },
    image: `${SITE_URL}/images/logo.png`,
    description:
      "Produkty z plexi: tablice z logo Twojej marki, cenniki i oznaczenia w technice 3D. Matowe UV, LED z pilotem, 15+ kolor\u00f3w.",
    email: SITE_CONTACT.email,
    address: ORGANIZATION_POSTAL_ADDRESS,
    areaServed: "PL",
    knowsAbout: [...ORGANIZATION_KNOWS_ABOUT],
    ...(socialSameAs.length > 0 ? { sameAs: socialSameAs } : {}),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lumine Concept",
    url: SITE_URL,
    publisher: { "@id": ORGANIZATION_ID },
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
      />

      <Suspense fallback={null}>
        <ReferralBanner />
      </Suspense>

      <SectionRenderer pageId="home" sections={sections} />

    </>
  );
}
