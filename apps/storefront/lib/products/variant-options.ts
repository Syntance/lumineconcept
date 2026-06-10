/**
 * Medusa v2 store API zwraca `variant.options` jako tablicę
 * `{ value, option: { title } }`. UI (dobór wariantu na PDP) oczekuje
 * słownika `tytuł opcji → wartość`. Bez tej normalizacji produkt
 * z nie-kolorową opcją (np. „Wariant", „Rozmiar") nigdy nie znajduje
 * wariantu i CTA „dodaj do koszyka" zostaje na stałe disabled.
 */
export function variantOptionsRecord(raw: unknown): Record<string, string> {
  if (Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const entry of raw) {
      const item = entry as {
        value?: unknown;
        option?: { title?: unknown } | null;
      } | null;
      const title = item?.option?.title;
      const value = item?.value;
      if (typeof title === "string" && title && typeof value === "string") {
        out[title] = value;
      }
    }
    return out;
  }
  if (raw && typeof raw === "object") {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  }
  return {};
}
