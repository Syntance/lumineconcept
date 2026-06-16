/**
 * Atrybucja upsellu: gdy user kliknie sugestię w koszyku (cross_sell_click),
 * zapisujemy mapowanie upsellowanego produktu → produkt źródłowy. Jeśli ten
 * produkt zostanie potem dodany do koszyka, emitujemy `upsell_accepted`.
 *
 * TTL ogranicza fałszywe przypisania (user wraca po godzinach z innego źródła).
 */

const STORAGE_KEY = "lumine.upsell_referrals.v1";
const TTL_MS = 30 * 60 * 1000; // 30 min

interface ReferralEntry {
  fromProductId?: string;
  ts: number;
}

type ReferralMap = Record<string, ReferralEntry>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readMap(): ReferralMap {
  if (!isBrowser()) return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReferralMap;
  } catch {
    return {};
  }
}

function writeMap(map: ReferralMap): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

/** Oznacz produkt jako pochodzący z upsellu (wywołać przy cross_sell_click). */
export function markUpsellReferral(
  productId: string,
  fromProductId?: string,
): void {
  if (!productId) return;
  const map = readMap();
  map[productId] = { fromProductId, ts: Date.now() };
  writeMap(map);
}

/**
 * Zwraca atrybucję upsellu dla produktu i usuwa wpis (jednorazowo).
 * null gdy brak wpisu lub wpis wygasł.
 */
export function consumeUpsellReferral(
  productId: string,
): { fromProductId?: string } | null {
  if (!productId) return null;
  const map = readMap();
  const entry = map[productId];
  if (!entry) return null;

  delete map[productId];
  writeMap(map);

  if (Date.now() - entry.ts > TTL_MS) return null;
  return { fromProductId: entry.fromProductId };
}
