import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { HeroShadowPanel, heroPanelScale } from "@/components/home/hero-shadow-panel";
import { SITE_URL } from "@/lib/utils";
import { Logo3DFormClient } from "./client";

export const metadata: Metadata = {
  title: "Logo 3D — wycena indywidualna | Lumine Concept",
  description:
    "Logo Twojej marki w postaci ozdobnej tablicy 3D z plexi. Prześlij plik, podaj wymiary i kształt — bezpłatna wycena w 24h.",
  alternates: { canonical: `${SITE_URL}/sklep/logo-3d` },
};

export const revalidate = 60;

export default function Logo3dInquiryPage() {
  return (
    <>
      <HeroSection />
      <CustomQuoteSection />
      <RealizationsCta />
    </>
  );
}

/* ── Hero ───────────────────────────────────────────────────────── */

function HeroSection() {
  const scale = heroPanelScale;

  return (
    <section className="relative flex h-[calc(100svh-var(--shop-chrome-h))] min-h-0 w-full flex-col overflow-x-hidden">
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        <Image
          src="/images/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_42%]"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        <div className="absolute inset-x-0 top-0 z-20 px-4 pt-6 sm:pt-10">
          <div className="container mx-auto max-w-6xl">
            <Breadcrumbs
              className="[&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white"
              items={[
                { label: "Strona główna", href: "/" },
                { label: "Sklep", href: "/sklep" },
                { label: "Logo 3D" },
              ]}
            />
          </div>
        </div>

        <div className="absolute inset-0 z-10 flex">
          <HeroShadowPanel align="center">
            <div className="flex w-full justify-center">
              <div
                className="grid max-w-full grid-cols-1 justify-items-center px-2"
                style={{ rowGap: `calc(var(--cta-fs) * ${scale.gapCtaStack})` }}
              >
                <div
                  className="flex flex-col items-center text-center"
                  style={{
                    marginBottom: `calc(var(--cta-fs) * ${scale.gapBeforeCta})`,
                    rowGap: `calc(var(--cta-fs) * ${scale.gapAfterTitle})`,
                  }}
                >
                  <h1
                    className="m-0 text-center font-binerka tracking-[0.06em] !font-normal !text-white"
                    style={{
                      fontSize: `calc(var(--cta-fs) * ${scale.title})`,
                      lineHeight: 1,
                      fontWeight: 400,
                    }}
                  >
                    Logo 3D
                  </h1>

                  <div
                    className="flex flex-col items-center text-center"
                    style={{
                      rowGap: `calc(var(--cta-fs) * ${scale.gapAfterSubtitle})`,
                    }}
                  >
                    <p
                      className="m-0 max-w-[min(100%,46cqw)] text-center font-gilroy font-medium uppercase leading-snug tracking-[0.08em] !text-white"
                      style={{
                        fontSize: `calc(var(--cta-fs) * ${scale.subtitle})`,
                        fontWeight: 500,
                      }}
                    >
                      Tablica wizerunkowa z Twoim logo
                    </p>

                    <p
                      className="m-0 max-w-[min(100%,52cqw)] text-balance text-center font-gilroy font-light leading-snug tracking-[0.06em] !text-white/90"
                      style={{
                        fontSize: `calc(var(--cta-fs) * ${scale.body})`,
                        fontWeight: 300,
                      }}
                    >
                      Logo Twojej marki zrealizowane w postaci kreatywnej, ozdobnej tablicy,
                      którą możesz zamieścić na ścianie.
                    </p>
                  </div>
                </div>

                <Link
                  href="#formularz"
                  className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-none border-0 bg-white font-gilroy font-semibold uppercase tracking-[0.2em] !text-black shadow-none outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  style={{
                    fontSize: "var(--cta-fs)",
                    lineHeight: 1.15,
                    paddingLeft: `${scale.ctaPadX}em`,
                    paddingRight: `${scale.ctaPadX}em`,
                    paddingTop: `${scale.ctaPadY}em`,
                    paddingBottom: `${scale.ctaPadY}em`,
                    borderRadius: 0,
                  }}
                >
                  Wyślij zapytanie
                </Link>
              </div>
            </div>
          </HeroShadowPanel>
        </div>
      </div>
    </section>
  );
}

/* ── Custom quote section ───────────────────────────────────────── */

function CustomQuoteSection() {
  return (
    <section id="formularz" className="bg-brand-50 py-16 lg:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:items-start">
          <div className="relative aspect-3/4 w-full overflow-hidden lg:sticky lg:top-24">
            <Image
              src="/images/categories/logo-kategoria-nail-boss.png"
              alt="Tablica z logo Nail Boss — przykładowa realizacja Logo 3D"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center"
            />
          </div>

          <div>
            <h2 className="font-display text-3xl uppercase leading-tight tracking-[0.06em] text-brand-800 lg:text-4xl">
              Tablica wizerunkowa
              <br />z Logo
            </h2>

            <p className="mt-6 text-base leading-relaxed text-brand-800 lg:text-lg">
              Tablica akrylowa z logo 3D, może mieć dowolny kształt, jednak
              maksymalnie mieszczący się w rozmiarze 120×80 cm. Dodatkową opcją
              może być podświetlenie LED.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-brand-700">
              W związku z tym, że każdy produkt jest zupełnie inny, dokonujemy
              indywidualnej wyceny. Wpisz poniżej specyfikację, która pomoże nam
              oszacować kosztorys dla Ciebie.
            </p>

            <div className="mt-8">
              <Logo3DFormClient />
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
          Zobacz, jak Logo 3D wygląda w salonach beauty, gabinetach i punktach
          usługowych — od minimalistycznych logotypów po ozdobne tablice z LED.
        </p>
        <Link
          href="/realizacje#logo-3d"
          className="mt-8 inline-flex items-center justify-center border border-brand-300 px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-800 transition-colors hover:bg-brand-50 hover:text-brand-900"
        >
          Przejdź do realizacji &rarr;
        </Link>
      </div>
    </section>
  );
}
