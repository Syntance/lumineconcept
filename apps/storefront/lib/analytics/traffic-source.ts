/**
 * Określenie źródła ruchu użytkownika (UTM / bezpośredni / organiczny).
 * Przechowywane w order.metadata przy checkout.
 */

const UTM_LAST_STORAGE_KEY = "lumine.utm_last.v1";
const REFERRER_STORAGE_KEY = "lumine.referrer.v1";

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

function readStoredReferrer(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.sessionStorage.getItem(REFERRER_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Rozpoznaje źródło ruchu (UTM, bezpośredni, referrer itp.)
 * i zwraca czytelny label dla magazynu.
 */
export function getTrafficSourceLabel(): string {
  if (!isBrowser()) return "—";

  const utm = readStoredUtmLast();

  // UTM — najwyższa priorytet
  if (utm?.utm_source) {
    const source = utm.utm_source;
    const campaign = utm.utm_campaign ? ` / ${utm.utm_campaign}` : "";
    return `${source}${campaign}`;
  }

  // Referrer
  const referrer = readStoredReferrer();
  if (referrer) {
    try {
      const url = new URL(referrer);
      const host = url.hostname.replace("www.", "");
      return `${host} (referrer)`;
    } catch {
      return "referrer";
    }
  }

  // Direct
  return "direct";
}

/**
 * Zwraca pełny slug źródła dla metadata (do magazynu).
 * Format: `traffic_source: "instagram / summer_sale"` lub `"direct"`.
 */
export function getTrafficSourceMetadata(): string {
  if (!isBrowser()) return "direct";

  const utm = readStoredUtmLast();

  if (utm?.utm_source) {
    const source = utm.utm_source;
    const campaign = utm.utm_campaign || "organic";
    const medium = utm.utm_medium || "unknown";
    // Format: instagram/social/summer_sale
    return `${source}/${medium}/${campaign}`;
  }

  const referrer = readStoredReferrer();
  if (referrer) {
    try {
      const url = new URL(referrer);
      const host = url.hostname.replace("www.", "");
      return `${host}/referrer`;
    } catch {
      return "referrer/unknown";
    }
  }

  return "direct";
}
