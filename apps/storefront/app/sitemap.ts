import type { MetadataRoute } from "next";
import { medusa } from "@/lib/medusa/client";
import { sanityClient } from "@/lib/sanity/client";
import { BLOG_SLUGS_QUERY, PAGE_SLUGS_QUERY } from "@/lib/sanity/queries";
import { SITE_URL } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/sklep`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/sklep/gotowe-wzory`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/sklep/logo-3d`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/sklep/certyfikaty`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/salony-beauty`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/realizacje`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/konfiguracja`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/logo-3d`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { products } = await medusa.store.product.list({ limit: 1000 });
    const certTag = "certyfikat";
    const logoTag = "logo-3d";

    productPages = products.flatMap((product) => {
      const tags = (product.tags ?? []).map(
        (t) => ((t as unknown as { value: string }).value ?? "").toLowerCase(),
      );
      const lastModified = product.updated_at ? new Date(product.updated_at) : new Date();
      const paths: string[] = [];

      if (tags.includes(certTag)) {
        paths.push(`/sklep/certyfikaty/${product.handle}`);
      } else if (tags.includes(logoTag)) {
        paths.push(`/sklep/logo-3d/${product.handle}`);
      }
      paths.push(`/sklep/gotowe-wzory/${product.handle}`);

      return paths.map((p) => ({
        url: `${SITE_URL}${p}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    });
  } catch {
    // Medusa not available during build
  }

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await sanityClient.fetch<
      Array<{ slug: string; _updatedAt: string }>
    >(BLOG_SLUGS_QUERY);
    blogPages = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post._updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // Sanity not available during build
  }

  let sanityPages: MetadataRoute.Sitemap = [];
  try {
    const pages = await sanityClient.fetch<
      Array<{ slug: string; _updatedAt: string }>
    >(PAGE_SLUGS_QUERY);
    sanityPages = pages.map((p) => ({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: new Date(p._updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch {
    // Sanity not available during build
  }

  return [...staticPages, ...productPages, ...blogPages, ...sanityPages];
}
