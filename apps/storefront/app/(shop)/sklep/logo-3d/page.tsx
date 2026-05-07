import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
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
  return (
    <section className="relative isolate overflow-hidden bg-brand-900 text-white">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/categories/logo-kategoria-nail-boss.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(38,29,24,0.45)_0%,rgba(20,14,10,0.85)_70%)]"
        />
      </div>

      <div className="container mx-auto max-w-5xl px-4 pt-10 pb-24 lg:pt-12 lg:pb-32">
        <Breadcrumbs
          className="mb-0 [&_a]:text-white/80 [&_a:hover]:text-white [&_span]:text-white"
          items={[
            { label: "Strona główna", href: "/" },
            { label: "Sklep", href: "/sklep" },
            { label: "Logo 3D" },
          ]}
        />

        <div className="mt-12 text-center lg:mt-16">
          <h1 className="font-display text-4xl uppercase tracking-[0.08em] text-white sm:text-5xl lg:text-6xl">
            Logo 3D
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-sm uppercase leading-relaxed tracking-[0.18em] text-white/85 sm:text-base">
            Logo Twojej marki zrealizowane w postaci kreatywnej, ozdobnej tablicy,
            którą możesz zamieścić na ścianie.
          </p>
          <div className="mt-10">
            <Link
              href="#formularz"
              className="inline-flex items-center justify-center bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-900 transition-colors hover:bg-brand-100"
            >
              Wyślij zapytanie
            </Link>
          </div>
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
