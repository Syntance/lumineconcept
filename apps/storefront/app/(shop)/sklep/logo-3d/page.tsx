import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

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
      <HeroSection />
      <CustomQuoteSection />
      <LogoBoardRealizations items={realizations} />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section
      className="relative isolate min-h-48 w-full overflow-hidden bg-brand-900 text-white"
      style={{
        height:
          "calc(100svh - var(--shop-chrome-h) - max(1.25rem, env(safe-area-inset-bottom, 0px)))",
      }}
    >
      {/* Grafika: wypełnia sekcję, dopasowanie do wysokości okna z odstępem od dołu (wzór jak home Hero). */}
      <Image
        src="/images/categories/logo-hero-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Breadcrumbs u góry; nagłówek i CTA wyśrodkowane w pozostałej przestrzeni pionowej */}
      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{ padding: "2vw 3vw max(2vw, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="w-full shrink-0" style={{ fontSize: "clamp(0.5rem, 1vw, 0.8rem)" }}>
          <Breadcrumbs
            className="mb-0 text-[1em] [&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white [&_ol]:text-[1em]"
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep", href: "/sklep" },
              { label: "Tablice z logo" },
            ]}
          />
        </div>

        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          <div className="text-center">
            <h1
              className="font-binerka uppercase tracking-[0.06em] text-white"
              style={{ fontSize: "clamp(1rem, 4.7vw, 3.5rem)", lineHeight: 1.1 }}
            >
              Tablica z logo
            </h1>
            <p
              className="mx-auto uppercase leading-relaxed text-white/80"
              style={{
                fontSize: "clamp(0.6rem, 1.6vw, 1rem)",
                letterSpacing: "0.15em",
                marginTop: "clamp(0.2rem, 0.7vw, 0.5rem)",
                maxWidth: "50vw",
              }}
            >
              Logo Twojej marki zrealizowane w postaci kreatywnej ozdobnej tablicy,
              którą możesz zamieścić na ścianie
            </p>
            <div style={{ marginTop: "clamp(0.6rem, 2.2vw, 1.75rem)" }}>
              <a
                href="#formularz"
                className="inline-flex items-center justify-center bg-white font-semibold uppercase tracking-[0.18em] text-brand-900 transition-colors hover:bg-brand-100"
                style={{
                  fontSize: "clamp(0.55rem, 1.2vw, 0.85rem)",
                  padding: "0.9em 2.2em",
                }}
                aria-label="Przewiń do formularza — zamów tablicę z logo"
              >
                Uzyskaj wycenę
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
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
          {/* Lewa kolumna: zdjęcie na środku; na lg wysokość jak okno minus sticky + dolny odstęp (safe area) */}
          <div
            className="relative z-2 flex w-full justify-center max-lg:mx-auto max-lg:max-w-md lg:sticky lg:top-24 lg:self-start lg:min-h-[calc(100svh-6rem-max(1.25rem,env(safe-area-inset-bottom,0px)))] lg:max-h-[calc(100svh-6rem-max(1.25rem,env(safe-area-inset-bottom,0px)))] lg:items-center lg:py-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- PNG z alfą: bez optymalizacji Next (ostrzejsza maska). */}
            <img
              src="/images/categories/logo-kategoria-beauty-sisters.png"
              alt="Tablica z logo Beauty Sisters — przykładowa realizacja"
              width={693}
              height={915}
              className="h-auto w-full max-h-[min(85svh,720px)] object-contain object-center lg:max-h-full lg:w-auto lg:max-w-[min(100%,42vw)]"
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
