/**
 * Sentry w przeglądarce. Next.js ładuje ten plik przed jakimkolwiek
 * kodem klienta (lepiej niż `sentry.client.config.ts`, który był
 * domyślnym wzorcem w starszych wersjach SDK).
 *
 * Jeśli nie ma `NEXT_PUBLIC_SENTRY_DSN`, w ogóle nie inicjalizujemy
 * Sentry — nie chcemy ani kodu w bundlu, ani błędów w konsoli, ani
 * payloadu do nieistniejącego projektu.
 */
import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./lib/sentry/scrub";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1",
    ),

    // Session Replay — zostawiamy wyłączone domyślnie. Gdy komuś będzie
    // potrzebne debugowanie UX, można to odpalić przez env bez deployu kodu.
    replaysSessionSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_REPLAY_SAMPLE_RATE ?? "0",
    ),
    replaysOnErrorSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_REPLAY_ERROR_SAMPLE_RATE ?? "0",
    ),

    sendDefaultPii: false,

    beforeSend(event, hint) {
      return scrubSentryEvent(event, hint);
    },

    ignoreErrors: [
      // „Użytkownik zamknął kartę, fetch w tle się nie zdążył" — nie nasz problem.
      "AbortError",
      "ResizeObserver loop",
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // Network flaps — w praktyce powiadomienie o nich nic nie daje.
      "Failed to fetch",
      "NetworkError",
      "Load failed",
    ],

    denyUrls: [
      // Extension chromium/firefox wrzucają swoje błędy do globalnego onerror.
      /extensions?\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
  });
}

// Hook do zmian nawigacji w App Routerze — SDK używa go do trace'owania
// przejść między stronami. Nie łapiemy tu błędów.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
