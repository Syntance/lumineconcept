import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { seo } from "./schemas/objects/seo";
import { blogPost } from "./schemas/blog-post";
import { landingPage } from "./schemas/landing-page";
import { page } from "./schemas/page";
import { faq } from "./schemas/faq";
import { testimonial } from "./schemas/testimonial";
import { siteSettings } from "./schemas/site-settings";
import { salonLogo } from "./schemas/salon-logo";
import { instagramPost } from "./schemas/instagram-post";

export default defineConfig({
  name: "lumine-concept",
  title: "Lumine Concept CMS",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "7650ttlb",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [
      seo,
      blogPost,
      landingPage,
      page,
      faq,
      testimonial,
      siteSettings,
      salonLogo,
      instagramPost,
    ],
  },
});
