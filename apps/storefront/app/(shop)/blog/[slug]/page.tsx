import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "next-sanity";
import { sanityClient } from "@/lib/sanity/client";
import { BLOG_POST_BY_SLUG_QUERY, BLOG_SLUGS_QUERY } from "@/lib/sanity/queries";
import type { BlogPost } from "@/lib/sanity/types";
import { buildMetadata } from "@/lib/sanity/metadata";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { formatDate, SITE_URL } from "@/lib/utils";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await sanityClient
    .fetch<Array<{ slug: string }>>(BLOG_SLUGS_QUERY)
    .catch(() => []);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityClient
    .fetch<BlogPost>(BLOG_POST_BY_SLUG_QUERY, { slug })
    .catch(() => null);

  if (!post) return { title: "Artykuł nie znaleziony" };

  return buildMetadata({
    seo: post.seo,
    fallbackTitle: post.title,
    fallbackDescription: post.excerpt,
    fallbackImage: post.coverImage?.asset?.url,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await sanityClient
    .fetch<BlogPost>(BLOG_POST_BY_SLUG_QUERY, { slug })
    .catch(() => null);

  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    image: post.coverImage?.asset?.url,
    publisher: {
      "@type": "Organization",
      name: "Lumine Concept",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <article className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Strona główna", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <header className="max-w-3xl mx-auto text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            {post.category && (
              <span className="rounded bg-accent/10 px-3 py-1 text-sm font-medium text-accent-dark">
                {post.category}
              </span>
            )}
            <time dateTime={post.publishedAt} className="text-sm text-brand-500">
              {formatDate(post.publishedAt)}
            </time>
          </div>
          <h1 className="font-display text-3xl font-bold text-brand-800 lg:text-4xl">
            {post.title}
          </h1>
          {post.author && (
            <p className="mt-4 text-brand-600">Autor: {post.author}</p>
          )}
        </header>

        {post.coverImage?.asset?.url && (
          <div className="max-w-4xl mx-auto mb-12 aspect-[16/9] overflow-hidden rounded-xl">
            <img
              src={post.coverImage.asset.url}
              alt={post.coverImage.alt ?? post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="prose prose-brand mx-auto max-w-3xl">
          {post.body && <PortableText value={post.body} />}
        </div>
      </article>
    </>
  );
}
