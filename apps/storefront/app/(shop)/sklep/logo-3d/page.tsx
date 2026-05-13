import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PRODUCT_IMAGE_ARCH_UP_BORDER_RADIUS } from "@/lib/products/product-image-aspect";
import { SITE_URL } from "@/lib/utils";
import { TablicaZLogoFormClient } from "./client";
import { QuoteTitleBandMeasure } from "./QuoteTitleBandMeasure";

export const metadata: Metadata = {
  title: "Tablice z logo — wycena indywidualna | Lumine Concept",
  description:
    "Tablice z logo Twojej marki z plexi (także z podświetleniem LED). Prześlij plik, podaj wymiary i kształt — bezpłatna wycena w 24h.",
  alternates: { canonical: `${SITE_URL}/sklep/logo-3d` },
};

export const revalidate = 60;

export default function TablicaZLogoPage() {
  return (
    /* Jednolite tło kremowe — szczeliny subpikselowe nie przeświecają białym (#fff) z main/body. */
    <div className="bg-brand-50">
      <HeroSection />
      <CustomQuoteSection />
      <RealizationsCta />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative isolate w-full overflow-hidden bg-brand-900 text-white">
      {/* Zdjęcie ustawia wysokość sekcji — proporcje 1024×384 (8:3) */}
      <Image
        src="/images/categories/logo-hero-bg.png"
        alt=""
        width={1024}
        height={384}
        priority
        sizes="100vw"
        className="w-full object-cover"
      />

      {/* Treść — wszystkie rozmiary skalują się z szerokością (= 100vw = szerokość hero 8:3) */}
      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{ padding: "2vw 3vw 2vw" }}
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

        <div
          className="flex flex-1 flex-col items-center"
          style={{ paddingTop: "clamp(0.5rem, 5vw, 4rem)" }}
        >
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
      {/* lg: pełna szerokość viewportu; wysokość z --logo3d-white-h (QuoteTitleBandMeasure). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden bg-white lg:block lg:h-(--logo3d-white-h,15rem)"
      />

      <div className="relative z-1 mx-auto max-w-6xl px-4 pt-16 lg:pt-24">
        <div
          id="formularz"
          className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-x-14 lg:gap-y-10 lg:items-start"
        >
          <div
            className="relative z-2 aspect-3/4 w-full overflow-hidden max-lg:mx-auto max-lg:max-h-[min(100vw,28rem)] max-lg:max-w-md lg:sticky lg:top-24 lg:z-20 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:max-h-none"
            style={{ borderRadius: PRODUCT_IMAGE_ARCH_UP_BORDER_RADIUS }}
          >
            <Image
              src="/images/categories/logo-kategoria-nail-boss.png"
              alt="Tablica z logo Nail Boss — przykładowa realizacja"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center"
            />
          </div>

          <div className="relative z-2 max-lg:-mx-4 max-lg:bg-white max-lg:px-4 max-lg:pb-6 lg:col-start-2 lg:row-start-1 lg:z-10 lg:bg-transparent lg:px-0">
            <QuoteTitleBandMeasure>
              <h2 className="font-display text-3xl uppercase leading-tight tracking-[0.06em] text-brand-800 lg:text-5xl">
                Tablica wizerunkowa
                <br />
                z logo
              </h2>
            </QuoteTitleBandMeasure>
          </div>

          <div className="relative z-2 space-y-6 lg:col-start-2 lg:row-start-2 lg:pt-0">
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

/* ── Realizations CTA ───────────────────────────────────────────── */

function RealizationsCta() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="font-display text-2xl uppercase tracking-[0.18em] text-brand-800 lg:text-3xl">
          Zapoznaj się z naszymi realizacjami
        </h2>
        <div className="mx-auto mt-3 h-px w-12 bg-accent" />
        <p className="mx-auto mt-6 max-w-2xl text-base text-brand-700">
          Zobacz, jak tablice z logo prezentują się w salonach beauty, gabinetach i punktach
          usługowych — od minimalistycznych logotypów po ozdobne tablice z LED.
        </p>
        <Link
          href="/realizacje#tablica-z-logo"
          className="mt-8 inline-flex items-center justify-center border border-brand-300 px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-800 transition-colors hover:bg-brand-50 hover:text-brand-900"
        >
          Przejdź do realizacji &rarr;
        </Link>
      </div>
    </section>
  );
}
