/**
 * Kontekst strony dołączany do każdego eventa wg Notion ("User flows i analityka" → eventy core).
 *
 * UTM-y zapisujemy jednorazowo do `sessionStorage` przy pierwszej wizycie z parametrami,
 * żeby kolejne nawigacje SPA / strony bez `?utm_*` nie traciły atrybucji ruchu (np. user
 * z IG ląduje na /salony-beauty/?utm_source=instagram, a potem klika do /sklep — chcemy
 * dalej widzieć `instagram` w `utmSource`, a nie pusty referrer).
 *
 * Pełny zestaw przy `first-touch`. Po zamknięciu karty — czyścimy.
 */
import { ANALYTICS_SEGMENT } from "./segment";

const SESSION_KEY = "lumine.utm.v1";

export interface PageContext {
  segment: typeof ANALYTICS_SEGMENT;
  pagePath: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
}

interface StoredUtm {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readStoredUtm(): StoredUtm | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUtm;
  } catch {
    return null;
  }
}

function writeStoredUtm(value: StoredUtm): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } catch {
    /* tryb prywatny / quota — pomijamy */
  }
}

/**
 * Wczytuje UTM-y z bieżącego URL i zapisuje first-touch w sesji.
 * Wywoływać przy każdej zmianie ścieżki (PostHogProvider).
 */
export function captureUtmFromCurrentUrl(): void {
  if (!isBrowser()) return;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  const content = params.get("utm_content");

  if (!source && !medium && !campaign && !content) return;

  const stored = readStoredUtm();
  // First-touch wins — kolejne wejścia z innym `utm_source` w tej samej sesji nie nadpisują.
  if (stored?.source) return;

  writeStoredUtm({ source, medium, campaign, content });
}

/**
 * Pełen kontekst do dołączenia do eventu PostHog.
 * Zwraca `null` gdy SSR (eventy odpalają się tylko po stronie klienta).
 */
export function getPageContext(): PageContext | null {
  if (!isBrowser()) return null;
  const stored = readStoredUtm();
  return {
    segment: ANALYTICS_SEGMENT,
    pagePath: window.location.pathname,
    referrer: document.referrer || null,
    utmSource: stored?.source ?? null,
    utmMedium: stored?.medium ?? null,
    utmCampaign: stored?.campaign ?? null,
    utmContent: stored?.content ?? null,
  };
}

/**
 * Skrócony kontekst — tylko `segment` + `pagePath`. Używany w eventach które
 * nie potrzebują pełnej atrybucji (np. `cta_click`, `form_step`).
 */
export function getShortPageContext(): Pick<PageContext, "segment" | "pagePath"> | null {
  if (!isBrowser()) return null;
  return {
    segment: ANALYTICS_SEGMENT,
    pagePath: window.location.pathname,
  };
}
