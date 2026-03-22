import { createClient } from "next-sanity";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-12-01",
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN,
});
