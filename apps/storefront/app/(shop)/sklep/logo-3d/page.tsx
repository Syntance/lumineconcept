import type { Metadata } from "next";
import { LogoCategoryHeroSection } from "@/components/category/LogoCategoryHeroSection";

import { SITE_URL } from "@/lib/utils";
import { sanityClient } from "@/lib/sanity/client";
import { REALIZATION_GALLERY_PHOTOS_QUERY } from "@/lib/sanity/queries";
import { REALIZATION_GALLERY_DOC_IDS } from "@/lib/sanity/realization-gallery-doc-ids";
import type { RealizationPhoto, SanityImage } from "@/lib/sanity/types";
import { TablicaZLogoFormClient } from "./client";
import { QuoteTitleBandMeasure } from "./QuoteTitleBandMeasure";
import { LogoBoardRealizations } from "./LogoBoardRealizations";

export const metadata: Metadata = {
  title: "Tablice z logo — wycena indywidualna | Lumine Concept",
  description:
    "Tablice z logo Twojej marki z plexi (także z podświetleniem LED). Prześlij plik, podaj wymiary i kształt — bezpłatna wycena w 24h.",
  alternates: { canonical: `${SITE_URL}/sklep/logo-3d` },
};

export const revalidate = 60;

type GalleryQueryRow = {
  photos?: Array<{
    _key: string;
    alt?: string;
    asset?: SanityImage["asset"];
  }> | null;
} | null;

export default async function TablicaZLogoPage() {
  const docId = REALIZATION_GALLERY_DOC_IDS["tablica-z-logo"];
  const row = await sanityClient
    .fetch<GalleryQueryRow>(
      REALIZATION_GALLERY_PHOTOS_QUERY,
      { docId },
      { next: { revalidate: 60, tags: ["sanity"] } },
    )
    .catch(() => null);

  const realizations: RealizationPhoto[] =
    row?.photos
      ?.filter((p) => p.asset?.url != null)
      .map((p) => ({
        _key: p._key,
        image: { asset: p.asset!, alt: p.alt },
      })) ?? [];

  return (
    /* Jednolite tło kremowe — szczeliny subpikselowe nie przeświecają białym (#fff) z main/body. */
    <div className="bg-brand-50">
      <LogoCategoryHeroSection />
      <CustomQuoteSection />
      <LogoBoardRealizations items={realizations} />
    </div>
  );
}

/* ── Custom quote section ───────────────────────────────────────── */

function CustomQuoteSection() {
  return (
    <section className="relative overflow-x-clip bg-brand-50 pb-16 lg:pb-24">
      {/* Pełnoszerokościowy biały pasek u góry sekcji — jego wysokość ustawia
          QuoteTitleBandMeasure (do dolnej krawędzi tytułu po prawej).
          Zdjęcie z lewej ma przezroczyste rogi, więc na wysokości paska świecą
          one białym, a niżej — kremowym tłem sekcji. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden bg-white lg:block lg:h-(--logo3d-white-h,15rem)"
      />

      <div className="relative z-1 mx-auto max-w-6xl px-4 pt-16 lg:pt-24">
        <div
          id="formularz"
          className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-x-20 xl:gap-x-24"
        >
          {/* Lewa kolumna: sticky, wysokość dopasowana do okna (z padem od dołu), zdjęcie wyśrodkowane i skalowane (object-contain). */}
          <div
            className="relative z-2 flex w-full max-lg:mx-auto max-lg:max-w-md max-lg:justify-center lg:sticky lg:top-[calc(var(--shop-chrome-h)+var(--product-gallery-sticky-gap))] lg:h-[calc(100svh-var(--shop-chrome-h)-var(--product-gallery-sticky-gap)-2rem-env(safe-area-inset-bottom,0px))] lg:min-h-0 lg:items-center lg:justify-center lg:self-start"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- PNG z alfą: bez optymalizacji Next (ostrzejsza maska). */}
            <img
              src="/images/categories/logo-kategoria-beauty-sisters.png"
              alt="Tablica z logo Beauty Sisters — przykładowa realizacja"
              width={693}
              height={915}
              className="h-auto max-h-[min(55svh,915px)] w-full max-w-full object-contain object-center lg:max-h-full lg:w-auto lg:max-w-full"
            />
          </div>

          <div className="relative z-2 space-y-6">
            <QuoteTitleBandMeasure>
              <h2 className="font-display text-3xl uppercase leading-tight tracking-[0.06em] text-brand-800 lg:text-5xl">
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
