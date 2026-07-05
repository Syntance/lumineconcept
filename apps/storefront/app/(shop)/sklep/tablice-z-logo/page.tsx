import type { Metadata } from "next";
import { LogoCategoryHeroSection } from "@/components/category/LogoCategoryHeroSection";
import { getPageContent, getPageSeo, getSiteSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/content/metadata";
import type { GalleryPhoto } from "@/lib/content/types";
import { TablicaZLogoFormClient } from "./client";
import { QuoteTitleBandMeasure } from "./QuoteTitleBandMeasure";
import { QuoteImageCtaAlign } from "./QuoteImageCtaAlign";
import { LogoQuoteArchImage } from "./LogoQuoteArchImage";
import { LogoBoardRealizations } from "./LogoBoardRealizations";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([
    getPageSeo("logo-3d"),
    getSiteSettings(),
  ]);
  return buildMetadata({
    seo,
    fallbackTitle: "Tablice z logo — wycena indywidualna | Lumine Concept",
    fallbackDescription:
      "Tablice z logo Twojej marki z plexi (także z podświetleniem LED). Prześlij plik, podaj wymiary i kształt — bezpłatna wycena w 24h.",
    siteSettings: settings,
    path: "/sklep/tablice-z-logo",
  });
}

export const revalidate = 60;

export default async function TablicaZLogoPage() {
  const pageContent = await getPageContent("logo-3d");
  const realizations: GalleryPhoto[] = pageContent.gallery ?? [];

  return (
    <div className="bg-brand-50">
      <LogoCategoryHeroSection hero={pageContent.hero} />
      <CustomQuoteSection />
      <LogoBoardRealizations items={realizations} />
    </div>
  );
}

function CustomQuoteSection() {
  return (
    <section
      id="formularz"
      className="relative scroll-mt-0 overflow-x-clip bg-brand-50 pb-16 lg:scroll-mt-[calc(var(--header-sticky-height)+2.5rem)] lg:pb-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden bg-white lg:block lg:h-(--logo3d-white-h,15rem)"
      />
      <div className="relative z-1 mx-auto w-full max-w-[min(102rem,calc(100vw-2rem))] px-4 pt-16 lg:px-8 lg:pt-24">
        <div
          data-logo3d-grid
          className="grid gap-12 lg:grid-cols-2 lg:items-stretch lg:gap-x-20 xl:gap-x-24"
        >
          <QuoteImageCtaAlign>
            <LogoQuoteArchImage />
          </QuoteImageCtaAlign>
          <div className="relative z-2 space-y-6">
            <QuoteTitleBandMeasure>
              <h2
                id="logo3d-quote-title"
                className="font-display text-3xl uppercase leading-tight tracking-[0.06em] text-brand-800 lg:text-5xl"
              >
                Tablica wizerunkowa
                <br />
                z logo
              </h2>
            </QuoteTitleBandMeasure>
            <p className="text-base leading-relaxed text-brand-800 lg:text-lg">
              Tablica akrylowa z Twoim logo, może mieć dowolny kształt, jednak
              maksymalnie mieszczący się w rozmiarze 120×80 cm. Dodatkową opcją
              może być podświetlenie LED.
            </p>
            <p className="text-sm leading-relaxed text-brand-700">
              W związku z tym, że każdy produkt jest zupełnie inny, dokonujemy
              indywidualnej wyceny. Wpisz poniżej specyfikację, która pomoże nam
              oszacować kosztorys dla Ciebie.
            </p>
            <div className="pt-2">
              <TablicaZLogoFormClient />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
