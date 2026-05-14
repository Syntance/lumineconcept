import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { seo } from "./schemas/objects/seo";
import { faq } from "./schemas/faq";
import { testimonial } from "./schemas/testimonial";
import { siteSettings } from "./schemas/site-settings";
import { salonLogo } from "./schemas/salon-logo";
import { productFaq } from "./schemas/product-faq";
import { realizationGallery } from "./schemas/realization-gallery";
import { realizationStub } from "./schemas/realization-stub";
import { structure } from "./structure";

export default defineConfig({
  name: "lumine-concept",
  title: "Lumine Concept CMS",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "7650ttlb",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: [
      seo,
      faq,
      testimonial,
      siteSettings,
      salonLogo,
      productFaq,
      realizationGallery,
      realizationStub,
    ],
  },
});
