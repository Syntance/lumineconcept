import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProductsByTag } from "@/lib/medusa/products";
import { sanityClient, getSiteSettings } from "@/lib/sanity/client";
import { TESTIMONIALS_BY_PAGE_QUERY } from "@/lib/sanity/queries";
import type { Testimonial } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { PRODUCT_IMAGE_ASPECT_CLASS } from "@/lib/products/product-image-aspect";
import { cn, SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sklep — cenniki, tabliczki, logo z plexi do salonu beauty | Lumine Concept",
  description:
    "Gotowe cenniki, tabliczki, logo i oznaczenia z plexi dla salonów beauty. Kup online — szybka wysyłka. 6 000+ realizacji. Sprawdź ceny.",
  alternates: { canonical: `${SITE_URL}/sklep` },
};

export const revalidate = 60;

function extractBasePrice(metadata: Record<string, unknown> | undefined | null): number | null {
  const raw = metadata?.base_price;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractPrice(variant: unknown, metadata?: Record<string, unknown> | null): number {
  const v = variant as Record<string, unknown> | null;
  const cp = v?.calculated_price as Record<string, unknown> | undefined;
  const variantPrice = Number(cp?.calculated_amount ?? 0);
  if (variantPrice > 0) return variantPrice;
  return extractBasePrice(metadata) ?? 0;
}

const CATEGORIES = [
  {
    title: "Gotowe wzory",
    cta: "PRZEGLĄDAJ WZORY",
    href: "/sklep/gotowe-wzory",
    image: "/images/categories/gotowe-wzory-personel.webp",
  },
  {
    title: "Tablice z logo",
    cta: "Uzyskaj wycenę",
    href: "/sklep/logo-3d",
    image: "/images/categories/logo-kategoria-nail-boss.webp",
  },
  {
    title: "Certyfikaty",
    cta: "Zobacz certyfikaty",
    href: "/sklep/certyfikaty",
    image: "/images/categories/certyfikat-kategoria.png",
  },
] as const;

export default async function ShopHubPage() {
  const [bestsellers, settings, testimonials] = await Promise.all([
    getProductsByTag("bestseller", 4).catch(() => []),
    getSiteSettings(),
    sanityClient
      .fetch<Testimonial[]>(
        TESTIMONIALS_BY_PAGE_QUERY,
        { page: "shop" },
        { next: { revalidate: 300, tags: ["sanity"] } },
      )
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

      <section className="relative overflow-x-hidden bg-brand-100">
        <div className="relative z-10 bg-white pt-10 pb-0 lg:pt-12 lg:pb-0">
          <div className="container mx-auto px-4">
            <Breadcrumbs
              className="mb-0"
              items={[
                { label: "Strona główna", href: "/" },
                { label: "Sklep" },
              ]}
            />
          </div>
        </div>
        <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="relative inline-block">
            <div
              className="pointer-events-none absolute left-1/2 top-0 z-0 h-full w-screen -translate-x-1/2 bg-[linear-gradient(to_bottom,white_0%,white_50%,var(--color-brand-100)_50%,var(--color-brand-100)_100%)]"
              aria-hidden
            />
            <h1 className="relative z-10 mt-0 font-display text-4xl tracking-widest text-brand-800 lg:text-5xl">
              Sklep
            </h1>
          </div>
          <div className="relative z-10 mt-1 mx-auto h-px w-12 bg-accent" />
        </div>
      </section>

      {/* Kategorie obok siebie */}
      <section className="bg-brand-100 pb-16 pt-10 lg:pb-24 lg:pt-14">
        <nav className="container mx-auto max-w-[84rem] px-4">
          <div className="grid gap-[1.65rem] sm:grid-cols-3 sm:items-stretch sm:gap-[2.85rem]">
            {CATEGORIES.map((cat, index) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="shop-category-card group relative flex w-full overflow-hidden border border-brand-200 bg-white transition-shadow duration-300 hover:border-brand-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent max-sm:aspect-[3/1] max-sm:flex-row max-sm:items-stretch max-sm:p-0 sm:aspect-4/5 sm:flex-col sm:gap-0 sm:px-11 sm:pb-12 sm:pt-12 sm:h-full"
              >
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden max-sm:hidden">
                  <div className="relative h-full w-full bg-brand-50">
                    <Image
                      src={cat.image}
                      alt=""
                      fill
                      loading={index === 0 ? "eager" : "lazy"}
                      className={cn(
                        "relative z-10 object-cover transition-transform duration-300",
                        index === 0
                          ? "origin-bottom -translate-x-[1%] translate-y-[3.5%] scale-[1.05] object-bottom group-hover:scale-[1.1]"
                          : "object-center group-hover:scale-105",
                      )}
                      sizes="(max-width: 640px) 0px, (max-width: 1280px) 33vw, 420px"
                      aria-hidden
                    />
                  </div>
                </div>

                <div className="relative z-10 flex w-1/2 min-w-0 flex-col justify-center max-sm:px-3 max-sm:py-2 sm:min-h-0 sm:w-auto sm:flex-1 sm:px-0 sm:py-0">
                  <div className="-translate-y-6 flex min-h-[4.95rem] shrink-0 items-center justify-center max-sm:min-h-0 max-sm:w-full max-sm:translate-y-0">
                    <div className="inline-block max-w-[min(100%,14.3rem)] rounded-md bg-white/25 px-1.5 py-0.5 backdrop-blur-sm max-sm:max-w-none max-sm:bg-transparent max-sm:p-0 max-sm:backdrop-blur-none">
                      <h2 className="text-center font-display text-[1.65rem] tracking-wide text-brand-800 max-sm:text-[1.875rem] max-sm:leading-[1.05] max-sm:tracking-normal sm:text-[1.65rem] lg:text-[2.0625rem]">
                        {cat.title}
                      </h2>
                    </div>
                  </div>

                  <div className="hidden h-[1.65rem] shrink-0 sm:block" aria-hidden="true" />

                  <div className="relative hidden min-h-0 flex-1 translate-y-6 flex-col items-center text-center sm:flex">
                    <span className="mt-auto self-center pt-[1.1rem] text-[0.9625rem] font-medium uppercase tracking-[0.18em] text-brand-900">
                      <span className="inline-flex w-max max-w-full items-center gap-2 rounded-md bg-white/25 px-2 py-1 backdrop-blur-sm">
                        <span className="whitespace-nowrap">{cat.cta}</span>
                        <span aria-hidden="true" className="shrink-0">
                          &rarr;
                        </span>
                      </span>
                    </span>
                  </div>
                </div>

                <div className="absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden bg-brand-50 max-sm:block">
                  <Image
                    src={cat.image}
                    alt={cat.title}
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    className="relative z-10 origin-center object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, 0px"
                  />
                </div>
              </Link>
            ))}
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
                <h2 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
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
                  const price = extractPrice(product.variants?.[0], product.metadata as Record<string, unknown> | undefined);
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
                          imageAspectClassName={PRODUCT_IMAGE_ASPECT_CLASS}
                          imageAreaClassName="bg-white"
                          priority
                        />
                      </div>
                      <p className="text-center text-lg font-medium leading-snug text-brand-800 line-clamp-2 px-0.5">
                        {product.title}
                      </p>
                      <div className="flex w-full justify-center">
                        <PriceDisplay amount={price} listing />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/sklep/gotowe-wzory"
                  className="text-[14.2px] font-medium uppercase tracking-[0.216em] text-brand-500 hover:text-brand-900 transition-colors"
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
          <p className="font-display text-2xl tracking-wide text-brand-800 lg:text-3xl">
            Szukasz czegoś na zamówienie?
          </p>
          <p className="mt-3 text-base text-brand-500">
            Logo z własnym projektem, cennik pod wymiar — wycena w 24h
          </p>
          <Link
            href="/sklep/logo-3d#formularz"
            className="mt-6 inline-flex items-center justify-center rounded border border-brand-300 px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-800 transition-colors hover:bg-brand-50 hover:text-brand-900"
          >
            Zamów wycenę &rarr;
          </Link>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-brand-100 bg-brand-50 py-12 lg:py-16">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base text-brand-500">
            <span>{trustBar?.followers ?? "25 000+"} obserwujących</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.realizations ?? "6 000+"} realizacji</span>
            <span className="text-brand-300">·</span>
            <span>{trustBar?.shippingLabel ?? "Realizacja ok. 10 dni roboczych"}</span>
          </div>

          {displayTestimonials.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
              {displayTestimonials.map((t) => (
                <blockquote key={t._id} className="text-center">
                  <p className="text-base italic leading-relaxed text-brand-800">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-2 text-sm text-brand-400">
                    — {t.name}{t.company ? `, ${t.company}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          <Link
            href="/dlaczego-lumine#opinie"
            className="mt-8 inline-block text-sm font-medium uppercase tracking-[0.2em] text-brand-500 hover:text-brand-900 transition-colors"
          >
            Więcej opinii &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
