import type { ErrorEvent, EventHint } from "@sentry/nextjs";

/**
 * Lista kluczy, które są pewną PII w kontekście naszego sklepu.
 * Cokolwiek się zgadza z tą listą (bez względu na wielkość liter), zostaje
 * zamienione na `"[redacted]"`, zanim event poleci do Sentry.
 *
 * Celowo wymieniamy rzeczy po polsku — w formularzu checkoutu wysyłamy
 * payloady z kluczami `imie`, `nazwisko`, `telefon`, `adres`.
 */
const PII_KEYS = new Set<string>(
  [
    "email",
    "phone",
    "telefon",
    "firstName",
    "first_name",
    "imie",
    "lastName",
    "last_name",
    "nazwisko",
    "name",
    "fullName",
    "address",
    "adres",
    "street",
    "ulica",
    "city",
    "miasto",
    "postalCode",
    "postal_code",
    "kod_pocztowy",
    "zip",
    "country",
    "kraj",
    "pesel",
    "nip",
    "regon",
    "password",
    "token",
    "authorization",
    "cookie",
    "setCookie",
    "x-publishable-api-key",
    "x-webhook-secret",
  ].map((k) => k.toLowerCase()),
);

function redactDeep(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((v) => redactDeep(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (PII_KEYS.has(k.toLowerCase())) {
        out[k] = "[redacted]";
        continue;
      }
      out[k] = redactDeep(v, depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Wyjazd Sentry z maskowaniem PII. Czyścimy request body, query params,
 * headers, extra, tags, user i breadcrumbs.
 *
 * Nie nadpisujemy `user.id` — chcemy wiedzieć, że „ten sam anonim" trafił
 * na 5 issues, ale bez jego maila czy adresu.
 */
export function scrubSentryEvent(
  event: ErrorEvent,
  _hint: EventHint,
): ErrorEvent | null {
  if (event.request) {
    if (event.request.data) {
      event.request.data = redactDeep(event.request.data) as typeof event.request.data;
    }
    if (event.request.headers) {
      event.request.headers = redactDeep(event.request.headers) as typeof event.request.headers;
    }
    if (event.request.cookies) {
      event.request.cookies = redactDeep(event.request.cookies) as typeof event.request.cookies;
    }
    if (event.request.query_string && typeof event.request.query_string === "string") {
      // Nie parsujemy query stringa — to się szybko wywala. Całość idzie
      // do redakcji, bo w query często trzyma się filtry per-user.
      event.request.query_string = "[redacted]";
    }
  }

  if (event.user) {
    event.user = {
      id: event.user.id,
      ip_address: event.user.ip_address === "{{auto}}" ? undefined : "[redacted]",
    };
  }

  if (event.extra) {
    event.extra = redactDeep(event.extra) as typeof event.extra;
  }

  if (event.tags) {
    event.tags = redactDeep(event.tags) as typeof event.tags;
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => ({
      ...b,
      data: b.data ? (redactDeep(b.data) as typeof b.data) : b.data,
      message:
        typeof b.message === "string" && b.message.includes("@")
          ? "[redacted email in message]"
          : b.message,
    }));
  }

  return event;
}
