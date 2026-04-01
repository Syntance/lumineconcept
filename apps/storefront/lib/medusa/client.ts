import Medusa from "@medusajs/js-sdk";

/** Po stronie serwera: bezpośrednio do Medusy (bez self-fetch przez /api/medusa). Używamy || — pusty string w .env nie może nadpisać domyślnego hosta. */
const SERVER_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim() ||
  "http://localhost:9000";

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
