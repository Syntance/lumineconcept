import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProductsByTag } from "@/lib/medusa/products";
import { sanityClient } from "@/lib/sanity/client";
import {
  SHOP_CATEGORIES_QUERY,
  TESTIMONIALS_QUERY,
  SITE_SETTINGS_QUERY,
} from "@/lib/sanity/queries";
import type { ShopCategory, Testimonial, SiteSettings } from "@/lib/sanity/types";
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

const CATEGORY_CARDS = [
  {
    emoji: "🛒",
    title: "Gotowe wzory",
    description: "Cenniki, tabliczki, menu, QR — wybierz i kup. Wysyłka w 48h.",
    cta: "Zobacz produkty",
    href: "/sklep/gotowe-wzory",
  },
  {
    emoji: "✨",
    title: "Logo 3D",
    description: "Gotowe wzory logo 3D i LED. Twój salon — od ręki.",
    cta: "Zobacz logo",
    href: "/sklep/logo-3d",
  },
  {
    emoji: "🎀",
    title: "Pakiety brandingowe",
    description: "Cennik + tabliczki + logo — wszystko w zestawie. Oszczędź do -10%.",
    cta: "Zobacz pakiety",
    href: "/sklep/pakiety",
  },
] as const;

export default async function ShopHubPage() {
  const [bestsellers, sanityCategories, settings, testimonials] = await Promise.all([
    getProductsByTag("bestseller", 4).catch(() => []),
    sanityClient
      .fetch<ShopCategory[]>(SHOP_CATEGORIES_QUERY, {}, { next: { revalidate: 120 } })
      .catch(() => []),
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
            itemListElement: CATEGORY_CARDS.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_URL}${c.href}`,
              name: c.title,
            })),
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-brand-50 py-14 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <Breadcrumbs
            items={[
              { label: "Strona główna", href: "/" },
              { label: "Sklep" },
            ]}
          />
          <h1 className="font-display text-3xl tracking-[0.06em] text-brand-800 lg:text-4xl">
            Gotowe wzory z plexi — kup od ręki, wysyłka w 48h
          </h1>
          <p className="mt-4 mx-auto max-w-2xl text-brand-600 leading-relaxed">
            Cenniki, tabliczki, oznaczenia, logo — gotowe wzory do Twojego salonu. Bez czekania na projekt.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-medium uppercase tracking-wider text-brand-500">
            <span className="rounded-full border border-brand-200 px-4 py-1.5">Szybka wysyłka</span>
            <span className="rounded-full border border-brand-200 px-4 py-1.5">Płatność online</span>
            <span className="rounded-full border border-brand-200 px-4 py-1.5">
              {trustBar?.realizations ?? "6 000+"} realizacji
            </span>
          </div>
        </div>
      </section>

      {/* 3 category cards */}
      <section className="bg-white py-14 lg:py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {CATEGORY_CARDS.map((card, i) => {
              const sanCat = sanityCategories[i];
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group flex flex-col overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-4/3 bg-brand-100">
                    {sanCat?.heroImage?.asset?.url ? (
                      <Image
                        src={sanCat.heroImage.asset.url}
                        alt={sanCat.heroImage.alt ?? card.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        placeholder={sanCat.heroImage.asset.metadata?.lqip ? "blur" : "empty"}
                        blurDataURL={sanCat.heroImage.asset.metadata?.lqip}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl">
                        {card.emoji}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl tracking-wide text-brand-800">
                      {card.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-600">
                      {card.description}
                    </p>
                    <span className="mt-4 inline-flex items-center text-sm font-medium text-brand-800 group-hover:text-brand-900">
                      {card.cta} &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bestsellery — identyczny layout jak na HP */}
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

              <div className="mx-auto max-w-[90%] grid grid-cols-2 items-start gap-x-4 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-8">
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
                          thumbnail={product.thumbnail ?? null}
                          price={price}
                          frameVariant={frameVariant}
                          imageOnly
                          linkless
                          sharpCorners={sharpCorners}
                          imageAspectClassName="aspect-[4/5]"
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

      {/* Banner cross-sell custom */}
      <section className="bg-white py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-brand-50 px-6 py-12 text-center lg:px-16">
            <p className="font-display text-xl tracking-wide text-brand-800 lg:text-2xl">
              Szukasz czegoś na zamówienie?
            </p>
            <p className="max-w-lg text-sm text-brand-600">
              Logo z własnym projektem, cennik pod wymiar — wycena w 24h
            </p>
            <Link
              href="/logo-3d/#formularz"
              className="mt-2 inline-flex items-center justify-center rounded-md bg-brand-900 px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-brand-800"
            >
              Zamów wycenę &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-600">
            <span>📷 {trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Express wysyłka"}</span>
          </div>

          {displayTestimonials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t._id} className="rounded-xl bg-white p-6 text-left shadow-sm">
                  <p className="text-sm italic text-brand-700 leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-3 text-xs text-brand-500">
                    — {t.name}{t.company ? `, ${t.company}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          <Link
            href="/dlaczego-lumine#opinie"
            className="mt-8 inline-block text-[13.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Więcej opinii &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
