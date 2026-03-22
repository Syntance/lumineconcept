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
  seoTitle,
  seoDescription
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
  seoTitle,
  seoDescription
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
  seo
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

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  title,
  description,
  announcementBar,
  socialLinks,
  footerText
}`;
