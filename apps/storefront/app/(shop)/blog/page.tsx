import type { Metadata } from "next";
import Link from "next/link";
import { sanityClient } from "@/lib/sanity/client";
import { BLOG_POSTS_QUERY } from "@/lib/sanity/queries";
import type { BlogPost } from "@/lib/sanity/types";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Porady, inspiracje i trendy ze świata beauty i brandingu. Blog Lumine Concept.",
};

export const revalidate = 60;

export default async function BlogPage() {
  const posts = await sanityClient
    .fetch<BlogPost[]>(BLOG_POSTS_QUERY)
    .catch(() => [] as BlogPost[]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Strona główna", href: "/" },
          { label: "Blog" },
        ]}
      />
      <h1 className="font-display text-3xl font-bold text-brand-900 mb-4">
        Blog
      </h1>
      <p className="text-brand-600 max-w-2xl mb-12">
        Porady, inspiracje i trendy ze świata beauty i brandingu.
      </p>

      {posts.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post._id} className="group">
              <Link href={`/blog/${post.slug}`}>
                <div className="aspect-[16/10] overflow-hidden rounded-lg bg-brand-100 mb-4">
                  {post.coverImage?.asset?.url ? (
                    <img
                      src={post.coverImage.asset.url}
                      alt={post.coverImage.alt ?? post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-brand-300">
                      Brak zdjęcia
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {post.category && (
                    <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-dark">
                      {post.category}
                    </span>
                  )}
                  <time
                    dateTime={post.publishedAt}
                    className="text-xs text-brand-500"
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                </div>
                <h2 className="font-display text-lg font-semibold text-brand-900 group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-brand-600 line-clamp-2">
                  {post.excerpt}
                </p>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-center text-brand-500 py-12">
          Wkrótce pojawią się tutaj artykuły. Wróć niedługo!
        </p>
      )}
    </div>
  );
}
