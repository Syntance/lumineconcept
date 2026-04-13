import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { sanityClient, cachedSanityFetch } from "@/lib/sanity/client";
import { PAGE_BY_SLUG_QUERY, PAGE_SLUGS_QUERY } from "@/lib/sanity/queries";
import type { Page } from "@/lib/sanity/types";
import { buildMetadata } from "@/lib/sanity/metadata";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const revalidate = 60;
const UNDER_CONSTRUCTION_SLUGS = new Set(["o-nas", "kontakt"]);

export async function generateStaticParams() {
  const pages = await sanityClient
    .fetch<Array<{ slug: string }>>(PAGE_SLUGS_QUERY)
    .catch(() => []);
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (UNDER_CONSTRUCTION_SLUGS.has(slug)) {
    return {
      title: "Strona w budowie",
      description: "Ta strona jest tymczasowo niedostępna. Trwają prace.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
  const page = await cachedSanityFetch<Page>(PAGE_BY_SLUG_QUERY, { slug })
    .catch(() => null);

  if (!page) return { title: "Strona nie znaleziona" };

  return buildMetadata({
    seo: page.seo,
    fallbackTitle: page.title,
    path: `/${page.slug}`,
  });
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (UNDER_CONSTRUCTION_SLUGS.has(slug)) {
    const pageTitle = slug === "o-nas" ? "O nas" : "Kontakt";
    return (
      <article className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Strona główna", href: "/" },
            { label: pageTitle },
          ]}
        />
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 font-display text-3xl font-bold text-brand-800 lg:text-4xl">
            {pageTitle}
          </h1>
          <div className="rounded-lg border border-brand-200 p-8 text-center text-brand-500">
            <p className="text-lg">Strona w budowie</p>
            <p className="mt-2 text-sm">Wróć wkrótce — kończymy prace nad tą podstroną.</p>
          </div>
        </div>
      </article>
    );
  }
  const page = await cachedSanityFetch<Page>(PAGE_BY_SLUG_QUERY, { slug })
    .catch(() => null);

  if (!page) notFound();

  return (
    <article className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: page.title },
        ]}
      />

      <header className="max-w-3xl mx-auto mb-8">
        <h1 className="font-display text-3xl font-bold text-brand-800 lg:text-4xl">
          {page.title}
        </h1>
      </header>

      <div className="prose prose-brand mx-auto max-w-3xl">
        {page.body && <PortableText value={page.body} />}
      </div>
    </article>
  );
}
