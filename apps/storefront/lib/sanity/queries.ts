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

/* ── FAQ (po stronie) ─────────────────────────────────────────────── */

export const FAQ_BY_PAGE_QUERY = `*[_type == "faq" && (page == $page || page == "global")] | order(order asc) {
  _id,
  page,
  question,
  answer,
  order
}`;

/* ── Opinie klientów (po stronie) ─────────────────────────────────── */

export const TESTIMONIALS_BY_PAGE_QUERY = `*[_type == "testimonial" && (page == $page || page == "global")] | order(order asc, _createdAt desc) {
  _id,
  page,
  name,
  role,
  company,
  quote,
  image {
    asset-> { _id, url, metadata { lqip } },
    alt
  },
  rating,
  order
}`;

/* ── FAQ produktowe (po handle z Medusy) ──────────────────────────── */

export const PRODUCT_FAQ_QUERY = `*[_type == "productFaq" && productHandle == $handle] | order(order asc) {
  _id,
  question,
  answer,
  order
}`;

/* ── Logotypy salonów (karuzela na HP) ────────────────────────────── */

export const SALON_LOGOS_QUERY = `*[_type == "salonLogo"] | order(order asc) {
  _id,
  name,
  logo {
    asset-> { _id, url }
  },
  order
}`;

/* ── Galeria realizacji (wiele zdjęć w jednym dokumencie) ─────────── */

export const REALIZATION_GALLERY_PHOTOS_QUERY = `*[_id == $docId][0] {
  photos[] {
    _key,
    alt,
    asset-> {
      _id,
      url,
      metadata { dimensions, lqip }
    }
  }
}`;

/* ── Ustawienia witryny ───────────────────────────────────────────── */

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  title,
  description,
  announcementBar,
  trustBar,
  checkoutCallout,
  socialLinks,
  footerText,
  titleTemplate,
  googleSiteVerification,
  seo ${SEO_PROJECTION},
  defaultOgImage {
    asset-> { _id, url }
  }
}`;
