import type { PortableTextBlock } from "next-sanity";

export interface SanityImage {
  asset: {
    _id: string;
    url: string;
    metadata: {
      dimensions: { width: number; height: number };
      lqip: string;
    };
  };
  alt?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body?: PortableTextBlock[];
  coverImage: SanityImage;
  category: string;
  author?: string;
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface LandingPage {
  _id: string;
  title: string;
  slug: string;
  hero: {
    heading: string;
    subheading?: string;
    image?: SanityImage;
    ctaText?: string;
    ctaLink?: string;
  };
  sections: ContentSection[];
  seo?: {
    title: string;
    description: string;
    image?: SanityImage;
  };
}

export interface ContentSection {
  _type: string;
  _key: string;
  heading?: string;
  body?: PortableTextBlock[];
  image?: SanityImage;
  items?: Array<{
    _key: string;
    title: string;
    description: string;
    icon?: string;
  }>;
}

export interface Testimonial {
  _id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  image?: SanityImage;
  rating: number;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface SiteSettings {
  title: string;
  description: string;
  announcementBar?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  footerText?: string;
}
