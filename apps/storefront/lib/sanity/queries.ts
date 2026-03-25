const SEO_PROJECTION = `{
  metaTitle,
  metaDescription,
  ogTitle,
  ogDescription,
  ogImage {
    asset-> { _id, url }
  },
  canonicalUrl,
  noIndex,
  noFollow
}`;

export const BLOG_POSTS_QUERY = `*[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage {
    asset-> {
      _id,
      url,
      metadata { dimensions, lqip }
    },
    alt
  },
  category,
  publishedAt,
  seo ${SEO_PROJECTION}
}`;

export const BLOG_POST_BY_SLUG_QUERY = `*[_type == "blogPost" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  body,
  coverImage {
    asset-> {
      _id,
      url,
      metadata { dimensions, lqip }
    },
    alt
  },
  category,
  author,
  publishedAt,
  seo ${SEO_PROJECTION}
}`;

export const BLOG_SLUGS_QUERY = `*[_type == "blogPost" && defined(slug.current)] {
  "slug": slug.current,
  _updatedAt
}`;

export const LANDING_PAGE_QUERY = `*[_type == "landingPage" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  hero,
  sections,
  seo ${SEO_PROJECTION}
}`;

export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  body,
  seo ${SEO_PROJECTION}
}`;

export const PAGE_SLUGS_QUERY = `*[_type == "page" && defined(slug.current)] {
  "slug": slug.current,
  _updatedAt
}`;

export const TESTIMONIALS_QUERY = `*[_type == "testimonial"] | order(_createdAt desc) {
  _id,
  name,
  role,
  company,
  quote,
  image {
    asset-> { _id, url, metadata { lqip } },
    alt
  },
  rating
}`;

export const FAQ_QUERY = `*[_type == "faq"] | order(order asc) {
  _id,
  question,
  answer,
  category
}`;

export const SALON_LOGOS_QUERY = `*[_type == "salonLogo"] | order(order asc) {
  _id,
  name,
  logo {
    asset-> { _id, url }
  },
  order
}`;

export const INSTAGRAM_POSTS_QUERY = `*[_type == "instagramPost"] | order(order asc) {
  _id,
  image {
    asset-> {
      _id,
      url,
      metadata { dimensions, lqip }
    },
    alt
  },
  url,
  order
}`;

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  title,
  description,
  announcementBar,
  socialLinks,
  footerText,
  titleTemplate,
  googleSiteVerification,
  seo ${SEO_PROJECTION},
  defaultOgImage {
    asset-> { _id, url }
  }
}`;
