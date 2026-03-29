import { cache } from "react";
import { createClient } from "next-sanity";

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2026-03-22",
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN,
});

export const cachedSanityFetch = cache(
  <T>(query: string, params?: Record<string, string>): Promise<T> =>
    sanityClient.fetch<T>(query, params ?? {}),
);
