import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProductsByTag } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import {
  TESTIMONIALS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/lib/sanity/queries";
import type { Testimonial, SiteSettings } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sklep — cenniki, tabliczki, logo z plexi do salonu beauty | Lumine Concept",
  description:
    "Gotowe cenniki, tabliczki, logo i oznaczenia z plexi dla salonów beauty. Kup online — szybka wysyłka. 6 000+ realizacji. Sprawdź ceny.",
  alternates: { canonical: `${SITE_URL}/sklep` },
};

export const revalidate = 60;

function extractPrice(variant: unknown): number {
  const v = variant as Record<string, unknown> | null;
  const cp = v?.calculated_price as Record<string, unknown> | undefined;
  return Number(cp?.calculated_amount ?? 0);
}

const CATEGORIES = [
  {
    title: "Gotowe wzory",
    subtitle: "Kup od ręki · wysyłka w 48h",
    description: "Cenniki, tabliczki, menu, kody QR — gotowe wzory do Twojego salonu.",
    cta: "Przeglądaj gotowe wzory",
    href: "/sklep/gotowe-wzory",
  },
  {
    title: "Logo 3D",
    subtitle: "Plexi · LED · matowe UV",
    description: "Gotowe wzory logo 3D. 15+ kolorów, montaż w cenie.",
    cta: "Zobacz logo 3D",
    href: "/sklep/logo-3d",
  },
  {
    title: "Certyfikaty",
    subtitle: "Dyplomy · podziękowania · vouchery",
    description: "Eleganckie certyfikaty z plexi dla Twoich klientek.",
    cta: "Zobacz certyfikaty",
    href: "/sklep/certyfikaty",
  },
] as const;

export default async function ShopHubPage() {
  const [bestsellers, settings, testimonials] = await Promise.all([
    getProductsByTag("bestseller", 4).catch(() => []),
    sanityClient
      .fetch<SiteSettings>(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 300 } })
      .catch(() => null),
    sanityClient
      .fetch<Testimonial[]>(TESTIMONIALS_QUERY, {}, { next: { revalidate: 300 } })
      .catch(() => []),
  ]);

  const trustBar = settings?.trustBar;
  const displayTestimonials = testimonials.slice(0, 3);

  return (
    <>
      {/* Schema.org ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Sklep Lumine Concept",
            url: `${SITE_URL}/sklep`,
            numberOfItems: 3,
            itemListElement: CATEGORIES.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${c.href}`,
              name: c.title,
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-[#EEE8E0] pt-10 lg:pt-14">
        <div className="container mx-auto max-w-4xl px-4">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep" },
            ]}
          />
          <div className="mt-8 text-center">
            <h1 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
              Sklep
            </h1>
            <div className="mt-3 mx-auto h-px w-12 bg-accent" />
          </div>
        </div>
      </section>

      {/* Kategorie obok siebie */}
      <section className="bg-[#EEE8E0] pb-16 pt-12 lg:pb-24 lg:pt-16">
        <nav className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {CATEGORIES.map((cat, i) => {
              const align = "items-center text-center";
              const radius =
                i === 0
                  ? { borderRadius: "50% 50% 0 0 / 40% 40% 0 0" }
                  : i === CATEGORIES.length - 1
                    ? { borderRadius: "0 0 50% 50% / 0 0 40% 40%" }
                    : undefined;
              return (
              <Link
                key={cat.href}
                href={cat.href}
                style={radius}
                className={`group flex aspect-[4/5] border border-brand-200 bg-white px-6 transition-colors hover:border-brand-400 ${align}`}
              >
                <div className="my-auto flex flex-col items-center gap-5">
                  <h2 className="font-display text-xl tracking-wide text-brand-800 group-hover:text-brand-900 lg:text-2xl">
                    {cat.title}
                  </h2>
                  <p className="text-base leading-relaxed text-brand-400">
                    {cat.description}
                  </p>
                  <span className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-brand-500 transition-colors group-hover:text-brand-900">
                    {cat.cta} &rarr;
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        </nav>
      </section>

      {/* Bestsellery */}
      {bestsellers.length > 0 && (
        <section>
          <div className="bg-white pt-4 pb-0 md:pt-5">
            <div className="container mx-auto flex justify-center px-4">
              <div className="mx-auto flex w-full max-w-68 justify-center">
                <div className="relative aspect-421/396 w-[42%] min-w-15.75 max-w-30">
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 bottom-0 z-0 w-screen -translate-x-1/2 bg-brand-50"
                    aria-hidden
                  />
                  <Image
                    src="/images/lumine-signet-brown.png"
                    alt="Sygnet Lumine Concept"
                    fill
                    className="relative z-10 object-contain object-center"
                    sizes="120px"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 pt-3 pb-10 md:pt-4 lg:pt-4 lg:pb-10">
            <div className="container mx-auto px-4">
              <div className="text-center mb-10 lg:mb-12">
                <h2 className="font-display text-2xl tracking-widest text-brand-800 lg:text-3xl">
                  Bestsellery
                </h2>
                <div className="mt-3 mx-auto h-px w-12 bg-accent" />
              </div>

              <div className="mx-auto grid grid-cols-2 items-start gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
                {bestsellers.slice(0, 4).map((product, index) => {
                  const frameVariant =
                    index === 0
                      ? "arch-up"
                      : index === 2
                        ? "arch-down"
                        : "square";
                  const sharpCorners = index === 1 || index === 3;
                  const price = extractPrice(product.variants?.[0]);
                  return (
                    <Link
                      key={product.handle ?? product.id}
                      href={`/sklep/gotowe-wzory/${product.handle}`}
                      className="group flex min-h-0 min-w-0 flex-col items-center gap-2.5 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <div className="w-full">
                        <ProductCard
                          handle={product.handle ?? ""}
                          title={product.title}
                          thumbnail={product.thumbnail ?? (product.images as unknown as Array<{ url: string }> | undefined)?.[0]?.url ?? null}
                          price={price}
                          frameVariant={frameVariant}
                          imageOnly
                          linkless
                          sharpCorners={sharpCorners}
                          imageAspectClassName="aspect-[10/11]"
                          imageAreaClassName="bg-white"
                        />
                      </div>
                      <p className="text-center text-sm font-medium leading-snug text-brand-800 line-clamp-2 px-0.5">
                        {product.title}
                      </p>
                      <div className="flex w-full justify-center">
                        <PriceDisplay amount={price} />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/sklep/gotowe-wzory"
                  className="text-[13.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
                >
                  Zobacz cały sklep &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Custom CTA */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <p className="font-display text-xl tracking-wide text-brand-800 lg:text-2xl">
            Szukasz czegoś na zamówienie?
          </p>
          <p className="mt-3 text-sm text-brand-500">
            Logo z własnym projektem, cennik pod wymiar — wycena w 24h
          </p>
          <Link
            href="/logo-3d/#formularz"
            className="mt-6 inline-flex items-center justify-center rounded border border-brand-300 px-8 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-900"
          >
            Zamów wycenę &rarr;
          </Link>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-brand-500">
            <span>{trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Express wysyłka"}</span>
          </div>

          {displayTestimonials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t._id} className="text-center">
                  <p className="text-sm italic leading-relaxed text-brand-600">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-2 text-xs text-brand-400">
                    — {t.name}{t.company ? `, ${t.company}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          <Link
            href="/dlaczego-lumine#opinie"
            className="mt-8 inline-block text-[11px] font-medium uppercase tracking-[0.2em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Więcej opinii &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
