import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./scrub";

/**
 * Konfiguracja Sentry dla runtime'u Node.js (route handlery, RSC, SSR).
 * Uruchamiane z `instrumentation.ts` tylko wtedy, kiedy ustawiony jest
 * `SENTRY_DSN` — bez DSN w ogóle nie wchodzimy tu.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,

  // Domyślnie ruch produkcyjny jest duży — próbkujemy 10% transakcji.
  // `SENTRY_TRACES_SAMPLE_RATE` pozwala to przestawić bez deployu.
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),

  // Storefront ma klientów bez konta — PII trzyma się tylko w intencji,
  // nie chcemy go wysyłać do Sentry. Dodatkowy scrubbing w `beforeSend`.
  sendDefaultPii: false,

  beforeSend(event, hint) {
    return scrubSentryEvent(event, hint);
  },

  // Wyciszamy przewidywalne błędy Next.js, żeby nie zasypywały projektu.
  ignoreErrors: [
    // Anulowany nav / fetch — normalka w SPA.
    "AbortError",
    "cancelled",
    "Navigation cancelled",
    // Podczas HMR/dev Next.js rzuca takie błędy, nic z nimi nie robimy.
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
  ],
});
