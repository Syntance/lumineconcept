import Link from "next/link";
import type { Metadata } from "next";
import { getProducts } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import { TESTIMONIALS_QUERY } from "@/lib/sanity/queries";
import type { Testimonial } from "@/lib/sanity/types";
import { ProductCard } from "@/components/product/ProductCard";
import { TrustBadges } from "@/components/marketing/TrustBadges";
import { SocialProof } from "@/components/marketing/SocialProof";
import { NewsletterForm } from "@/components/marketing/NewsletterForm";

export const metadata: Metadata = {
  title: "Lumine Concept — Plexi & Branding dla Salonów Beauty",
  description:
    "Produkty z plexi i rozwiązania brandingowe dla salonów beauty. Loga 3D, stojaki, organizery, tablice cennikowe. Darmowa dostawa od 250 zł.",
  openGraph: {
    title: "Lumine Concept — Plexi & Branding dla Salonów Beauty",
    description:
      "Produkty z plexi i rozwiązania brandingowe dla salonów beauty.",
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const [productsResponse, testimonials] = await Promise.all([
    getProducts({ limit: 8, order: "-created_at" }).catch(() => null),
    sanityClient
      .fetch<Testimonial[]>(TESTIMONIALS_QUERY)
      .catch(() => [] as Testimonial[]),
  ]);

  const products = productsResponse?.products ?? [];

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lumine Concept",
    url: "https://lumine.syntance.dev",
    logo: "https://lumine.syntance.dev/images/logo.png",
    sameAs: [
      "https://www.instagram.com/lumineconcept/",
      "https://www.facebook.com/lumineconcept/",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
            Plexi & branding
            <br />
            <span className="text-accent">dla salonów beauty</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-600">
            Tworzymy produkty z plexi, które wyróżnią Twój salon. Loga 3D, stojaki
            na produkty, organizery, tablice cennikowe i wiele więcej.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/produkty"
              className="rounded-md bg-accent px-8 py-3 text-sm font-semibold text-white shadow hover:bg-accent-dark transition-colors"
            >
              Zobacz produkty
            </Link>
            <Link
              href="/konfiguracja"
              className="rounded-md border border-brand-300 px-8 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50 transition-colors"
            >
              Skonfiguruj własny
            </Link>
          </div>
        </div>
      </section>

      <TrustBadges />

      {products.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-brand-900">
                Nowości
              </h2>
              <Link
                href="/produkty"
                className="text-sm font-medium text-accent hover:text-accent-dark transition-colors"
              >
                Zobacz wszystkie
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  handle={product.handle ?? ""}
                  title={product.title}
                  thumbnail={product.thumbnail ?? null}
                  price={
                    (product.variants?.[0] as Record<string, unknown>)
                      ?.calculated_price
                      ? Number(
                          (
                            (product.variants[0] as Record<string, unknown>)
                              .calculated_price as Record<string, unknown>
                          )?.calculated_amount ?? 0,
                        )
                      : 0
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-brand-900 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold">
            Potrzebujesz logo 3D do swojego salonu?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-300">
            Prześlij swoje logo, a my przygotujemy wycenę i wizualizację 3D w
            ciągu 24 godzin.
          </p>
          <Link
            href="/logo-3d"
            className="mt-8 inline-block rounded-md bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
          >
            Prześlij logo
          </Link>
        </div>
      </section>

      {testimonials.length > 0 && <SocialProof testimonials={testimonials} />}

      <section className="py-16">
        <div className="container mx-auto max-w-xl px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-brand-900">
            Bądź na bieżąco
          </h2>
          <p className="mt-2 text-brand-600">
            Zapisz się do newslettera i otrzymaj 10% rabatu na pierwsze zamówienie.
          </p>
          <div className="mt-6">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
