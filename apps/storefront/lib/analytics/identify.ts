/**
 * Identyfikacja użytkownika — Notion "Analityka i konwersje" → sekcja 3.
 *
 * Momenty identyfikacji (kolejność prawdopodobieństwa, wszystkie obsłużone):
 *  - formularz wyceny `/sklep/logo-3d` (krok 1: email + opcjonalnie imię)
 *  - formularz `/salony-beauty/` / kontakt na HP (analogicznie)
 *  - lead magnet (popup / inline)
 *  - newsletter signup
 *  - checkout `/checkout` (krok 1: email — `onBlur`)
 *
 * Zasada: anonimowy distinct_id PostHog jest mergowany z profilem przy pierwszym
 * `identify(email)`. PostHog robi merge automatycznie. Po `purchase` dorzucamy
 * agregaty (`totalSpent`, `ordersCount`) przez `posthog.people.set`.
 */
import { identifyUser, setUserProperties } from "./posthog";
import { ANALYTICS_SEGMENT } from "./segment";

export type IdentifySource =
  | "form_logo3d"
  | "form_salony"
  | "form_kontakt"
  | "checkout"
  | "lead_magnet"
  | "newsletter";

export interface IdentifyArgs {
  email: string;
  name?: string;
  source: IdentifySource;
}

/**
 * Wywoływać tuż po wpisaniu emaila przez użytkownika (`onBlur` / krok 1 formularza).
 * Bez `await` — PostHog ładuje się leniwie, identify wpadnie do kolejki.
 */
export function identifyLead({ email, name, source }: IdentifyArgs): void {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return;
  identifyUser(trimmed, {
    $email: trimmed,
    name: name?.trim() || undefined,
    segment: ANALYTICS_SEGMENT,
    source,
  });
}

/** Po purchase: oznacz profil jako `customer` + dorzuć agregaty. */
export function markPurchaseCustomer(args: {
  email?: string;
  orderId: string;
  value: number;
}): void {
  if (args.email) {
    identifyLead({ email: args.email, source: "checkout" });
  }
  setUserProperties({
    firstOrderId: args.orderId,
    totalSpent: args.value,
    ordersCount: 1,
    segment: ANALYTICS_SEGMENT,
  });
}
