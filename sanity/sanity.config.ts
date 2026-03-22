import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { blogPost } from "./schemas/blog-post";
import { landingPage } from "./schemas/landing-page";
import { faq } from "./schemas/faq";
import { testimonial } from "./schemas/testimonial";
import { siteSettings } from "./schemas/site-settings";

export default defineConfig({
  name: "lumine-concept",
  title: "Lumine Concept CMS",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "your-project-id",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [blogPost, landingPage, faq, testimonial, siteSettings],
  },
});
