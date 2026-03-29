import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { TrustBadges } from "@/components/marketing/TrustBadges";

export const metadata: Metadata = {
  title: "Salony Beauty — Produkty Plexi dla Twojego Salonu",
  description:
    "Kompletne rozwiązania brandingowe z plexi dla salonów beauty. Loga 3D, tablice cennikowe, organizery na kosmetyki, stojaki na karty wizytowe.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumine.syntance.dev"}/salony-beauty`,
  },
};

export default function SalonyBeautyPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white py-20">
        <div className="container mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Salony Beauty" },
            ]}
          />
          <div className="max-w-3xl">
            <h1 className="font-display text-3xl font-bold text-brand-800 lg:text-5xl">
              Wyróżnij swój salon
              <br />
              <span className="text-accent">dzięki produktom z plexi</span>
            </h1>
            <p className="mt-6 text-lg text-brand-600 max-w-2xl">
              Tworzymy eleganckie produkty z plexi, które nadadzą Twojemu salonowi beauty
              profesjonalny i nowoczesny wygląd. Od logo 3D po organizery — wszystko
              dopasowane do Twojej marki.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/sklep"
                className="rounded-md bg-accent px-8 py-3 text-center text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                Zobacz produkty
              </Link>
              <Link
                href="/logo-3d"
                className="rounded-md border border-brand-300 px-8 py-3 text-center text-sm font-semibold text-brand-900 hover:bg-brand-50 transition-colors"
              >
                Prześlij swoje logo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-brand-800 text-center mb-12">
            Co oferujemy dla salonów beauty?
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Logo 3D na ścianę",
                desc: "Wykonane z plexi lub pleksi z podświetleniem LED. Idealne do strefy recepcji.",
              },
              {
                title: "Tablice cennikowe",
                desc: "Eleganckie tablice z plexi z wygrawerowanymi cenami usług.",
              },
              {
                title: "Organizery na kosmetyki",
                desc: "Przejrzyste organizery, które pięknie eksponują produkty.",
              },
              {
                title: "Stojaki na karty wizytowe",
                desc: "Minimalistyczne stojaki dopasowane do estetyki salonu.",
              },
              {
                title: "Tabliczki na drzwi",
                desc: "Personalizowane tabliczki z nazwą gabinetu lub salonu.",
              },
              {
                title: "Konfigurator online",
                desc: "Stwórz własny produkt dopasowany do Twojego brandu.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-brand-100 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-display text-lg font-semibold text-brand-800">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-brand-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
