/**
 * Instrumentation hook Next.js — uruchamia się raz przy starcie runtime'u,
 * osobno dla edge i nodejs. Używamy go do inicjalizacji Sentry po stronie
 * serwera, żeby wszystkie nieobsłużone błędy w RSC, route handlerach
 * i middleware były łapane.
 *
 * Jeśli nie ma `SENTRY_DSN`, `Sentry.init` robi z tego no-op (sprawdzamy
 * wcześniej, żeby nie włączać instrumentacji w ogóle).
 */
import type { Instrumentation } from "next";

export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/sentry/sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./lib/sentry/sentry.edge.config");
  }
}

/**
 * Przekazujemy każdy niewychwycony request error do Sentry razem z kontekstem
 * z Next.js (m.in. routerKind, routePath). Dzięki temu w issue w Sentry od razu
 * widać, w którym route handlerze/RSC wybuchło.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  if (!process.env.SENTRY_DSN) return;
  const { captureRequestError } = await import("@sentry/nextjs");
  captureRequestError(err, request, context);
};
