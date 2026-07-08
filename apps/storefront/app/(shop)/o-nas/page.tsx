import type { Metadata } from "next";
import { cmsAttr } from "@/lib/cms-preview/attr";

import { ABOUT_PAGE_CLIP } from "@/components/about/about-media";
import { resolveAboutPage } from "@/lib/content/about";
import { getPageSeo, getSiteSettings } from "@/lib/content";
import { getPageSections } from "@/lib/content/sections";
import { buildMetadata } from "@/lib/content/metadata";
import { ORGANIZATION_ID } from "@/lib/geo/organization";
import { cn, SITE_URL } from "@/lib/utils";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { SectionRenderer } from "@/components/composer/SectionRenderer";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings, sections] = await Promise.all([
    getPageSeo("o-nas"),
    getSiteSettings(),
    getPageSections("o-nas"),
  ]);
  const aboutSection = sections.find((s) => s.type === "about");
  const about = resolveAboutPage({
    about: aboutSection?.type === "about" ? aboutSection.props : undefined,
  });

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
  const sections = await getPageSections("o-nas");
  const aboutSection = sections.find((s) => s.type === "about");
  const about = resolveAboutPage({
    about: aboutSection?.type === "about" ? aboutSection.props : undefined,
  });

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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutPageJsonLd) }}
      />
      <div
        className={cn(
          "font-gilroy w-full max-lg:bg-brand-50",
          ABOUT_PAGE_CLIP,
          "[&_h1]:font-binerka [&_h2]:font-binerka",
        )}
        {...(await cmsAttr("page.o-nas.sections"))}
      >
        <SectionRenderer pageId="o-nas" sections={sections} />
      </div>
    </>
  );
}
