import { getConsent } from "@/lib/consent/consent";
import { sendGA4Event } from "./destinations/ga4";
import { fbqTrack, resolveMetaEventId } from "./destinations/meta";
import * as posthog from "./destinations/posthog";
import type {
  AnalyticsEventMap,
  AnalyticsEventName,
} from "./events/registry";
import { isAnalyticsEvent } from "./events/registry";
import { ANALYTICS_SEGMENT } from "./segment";

const UTM_STORAGE_KEY = "lumine.utm.v1";
const UTM_LAST_STORAGE_KEY = "lumine.utm_last.v1";
const REFERRER_STORAGE_KEY = "lumine.referrer.v1";

/**
 * Eventy purchase są źródłem prawdy SERWEROWO (subscriber order.placed →
 * PostHog capture z odtworzonym distinct_id). Klient NIE wysyła purchase do
 * PostHog, żeby nie liczyć podwójnie. GA4 i Meta Pixel zostają client-side
 * (dedup przez event_id po stronie Meta).
 */
const POSTHOG_SERVER_ONLY_EVENTS = new Set<AnalyticsEventName>(["purchase"]);

interface StoredUtm {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStoredUtm(): StoredUtm | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUtm;
  } catch {
    return null;
  }
}

function writeStoredUtm(value: StoredUtm): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function readStoredUtmLast(): StoredUtm | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(UTM_LAST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUtm;
  } catch {
    return null;
  }
}

function writeStoredUtmLast(value: StoredUtm): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(UTM_LAST_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function readStoredReferrer(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage.getItem(REFERRER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredReferrer(referrer: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(REFERRER_STORAGE_KEY, referrer);
  } catch {
    /* quota / private mode */
  }
}

/**
 * Zapisuje UTM first-touch (localStorage) i referrer first-touch (sessionStorage).
 * Wywoływać przy każdej zmianie trasy.
 */
export function captureUtmFromCurrentUrl(): void {
  if (!isBrowser()) return;

  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get("utm_source");
  const utm_medium = params.get("utm_medium");
  const utm_campaign = params.get("utm_campaign");
  const utm_term = params.get("utm_term");
  const utm_content = params.get("utm_content");

  if (utm_source || utm_medium || utm_campaign || utm_term || utm_content) {
    const incoming = {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    };
    const stored = readStoredUtm();
    // First-touch: zapisz tylko raz (atrybucja pierwszego źródła).
    if (!stored?.utm_source) {
      writeStoredUtm(incoming);
    }
    // Last-touch: ZAWSZE nadpisuj (źródło bieżącej wizyty).
    writeStoredUtmLast(incoming);
  }

  const ref = document.referrer?.trim();
  if (ref && !readStoredReferrer()) {
    writeStoredReferrer(ref);
  }
}

export function withContext<T extends Record<string, unknown>>(
  payload: T,
): T & Record<string, unknown> {
  if (!isBrowser()) return payload;

  const storedUtm = readStoredUtm();
  const storedUtmLast = readStoredUtmLast();
  const referrer = readStoredReferrer() ?? (document.referrer || null);

  return {
    segment: ANALYTICS_SEGMENT,
    page_path: window.location.pathname,
    locale: document.documentElement.lang || "pl",
    referrer,
    // First-touch (atrybucja pierwszego źródła).
    utm_source: storedUtm?.utm_source ?? null,
    utm_medium: storedUtm?.utm_medium ?? null,
    utm_campaign: storedUtm?.utm_campaign ?? null,
    utm_term: storedUtm?.utm_term ?? null,
    utm_content: storedUtm?.utm_content ?? null,
    // Last-touch (źródło bieżącej wizyty) — fallback do first-touch.
    utm_source_last: storedUtmLast?.utm_source ?? storedUtm?.utm_source ?? null,
    utm_medium_last: storedUtmLast?.utm_medium ?? storedUtm?.utm_medium ?? null,
    utm_campaign_last:
      storedUtmLast?.utm_campaign ?? storedUtm?.utm_campaign ?? null,
    ...payload,
  };
}

export function track<E extends AnalyticsEventName>(
  name: E,
  payload: AnalyticsEventMap[E],
): void {
  if (!isBrowser()) return;
  if (!isAnalyticsEvent(name)) return;

  const enriched = withContext(payload as Record<string, unknown>);
  const consent = getConsent();

  if (consent?.analytics) {
    sendGA4Event(name, enriched);
  }

  if (consent?.analytics && !POSTHOG_SERVER_ONLY_EVENTS.has(name)) {
    posthog.capture(name, enriched);
  }

  if (consent?.marketing) {
    // event_id musi być identyczny w Pixel eventID i CAPI event_id — Meta deduplikuje konwersje.
    const fallbackEventId = crypto.randomUUID();
    const eventId = resolveMetaEventId(name, enriched, fallbackEventId);
    fbqTrack(name, enriched, eventId);
  }
}

export { posthog };
