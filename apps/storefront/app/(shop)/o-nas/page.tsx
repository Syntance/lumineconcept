import type { Metadata } from "next";

import { AboutClosingSection } from "@/components/about/AboutClosingSection";
import { ABOUT_PAGE_CLIP } from "@/components/about/about-media";
import { AboutHeroSection } from "@/components/about/AboutHeroSection";
import { AboutIntroSection } from "@/components/about/AboutIntroSection";
import { AboutMissionSection } from "@/components/about/AboutMissionSection";
import { resolveAboutPage } from "@/lib/content/about";
import { getPageContent, getPageSeo, getSiteSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/content/metadata";
import { ORGANIZATION_ID } from "@/lib/geo/organization";
import { SITE_URL } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings, pageContent] = await Promise.all([
    getPageSeo("o-nas"),
    getSiteSettings(),
    getPageContent("o-nas"),
  ]);
  const about = resolveAboutPage(pageContent);

  return buildMetadata({
    seo,
    fallbackTitle: "O nas — Lumine Concept",
    fallbackDescription:
      "Lumine Concept — marka tworzona przez dwie siostry. Projektujemy spójne rozwiązania dla salonów beauty: tablice z logo, certyfikaty i detale, które budują wizerunek premium.",
    siteSettings: settings,
    path: "/o-nas",
    fallbackImage: about.sections.introImageUrl.startsWith("http")
      ? about.sections.introImageUrl
      : `${SITE_URL}${about.sections.introImageUrl}`,
  });
}

export const revalidate = 60;

export default async function ONasPage() {
  const pageContent = await getPageContent("o-nas");
  const about = resolveAboutPage(pageContent);

  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "O nas — Lumine Concept",
    url: `${SITE_URL}/o-nas`,
    description: about.sections.introParagraphs[0] ?? "Lumine Concept — O nas",
    mainEntity: { "@id": ORGANIZATION_ID },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />
      <div className={`font-gilroy max-md:bg-brand-50 ${ABOUT_PAGE_CLIP} [&_h1]:font-binerka [&_h2]:font-binerka`}>
        <AboutHeroSection hero={about.hero} />
        <AboutIntroSection sections={about.sections} />
        <AboutMissionSection sections={about.sections} />
        <AboutClosingSection sections={about.sections} />
      </div>
    </>
  );
}
