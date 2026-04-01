import Medusa from "@medusajs/js-sdk";

/** W przeglądarce: Next.js proxy (`next.config.ts` rewrites) — ten sam origin, bez CORS/CSP. */
const SERVER_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? "";

function resolveBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/medusa`;
  }
  return SERVER_BACKEND_URL;
}

export const medusa = new Medusa({
  baseUrl: resolveBaseUrl(),
  publishableKey: PUBLISHABLE_KEY,
});
