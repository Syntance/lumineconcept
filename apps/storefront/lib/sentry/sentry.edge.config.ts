import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./scrub";

/**
 * Konfiguracja Sentry dla runtime'u Edge (middleware, edge route handlery).
 * Edge nie ma pełnego Node API, dlatego zostawiamy tylko podstawową
 * instrumentację — bez profilera, bez session replay.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,

  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),

  sendDefaultPii: false,
  beforeSend(event, hint) {
    return scrubSentryEvent(event, hint);
  },

  ignoreErrors: ["AbortError", "NEXT_REDIRECT", "NEXT_NOT_FOUND"],
});
