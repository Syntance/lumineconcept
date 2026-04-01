const DIRECT_KEYS = [
  "wymiary",
  "dimensions",
  "Wymiary",
  "rozmiar",
  "size",
  "wymiary_cm",
] as const;

function pickFromRecord(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta) return null;
  for (const key of DIRECT_KEYS) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  for (const [k, v] of Object.entries(meta)) {
    if (k.toLowerCase() === "wymiary" && typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return null;
}

/** Usuwa tagi HTML; zachowuje sens akapitów (np. „Wymiary:” w osobnej linii). */
export function stripHtmlForDimensions(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|tr|br)\s*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

const MAX_LABEL_LEN = 160;

function trimLabel(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= MAX_LABEL_LEN) return t;
  return `${t.slice(0, MAX_LABEL_LEN).trim()}…`;
}

/**
 * Wyciąga fragment o wymiarach z już oczyszczonego lub prostego tekstu (opis / specyfikacja).
 */
export function extractDimensionsFromPlainText(plain: string): string | null {
  const normalized = plain.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return null;

  const oneLine = normalized.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  const explicit = oneLine.match(
    /Wymiary(?:\s+produktu)?\s*[:\-–—]\s*([^\.\(]+?)(?:\.|\s*\(|$)/i,
  );
  if (explicit?.[1]) {
    const s = explicit[1].trim();
    if (s.length >= 2) return trimLabel(s);
  }

  const perLine = normalized.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of perLine) {
    const m = line.match(/^Wymiary\s*[:\-–—]\s*(.+)$/i);
    if (m?.[1]) return trimLabel(m[1].trim());
  }

  const inlineWord = oneLine.match(
    /Wymiary\s*[:\-–—]\s*([^\n\.]+?)(?:\.|\s+Zobacz|\s+Kolor|\s+Materiał|$)/i,
  );
  if (inlineWord?.[1]) return trimLabel(inlineWord[1].trim());

  const cmPair = oneLine.match(
    /(?:ok\.\s*)?([0-9]+(?:[\s,\.][0-9]+)?\s*[×x]\s*[0-9]+(?:[\s,\.][0-9]+)?\s*(?:cm|mm)\b)/i,
  );
  if (cmPair?.[1]) return trimLabel(cmPair[1].trim());

  const szer = oneLine.match(/szerokości?\s*[:\-–—]?\s*([0-9]+(?:[\s,\.][0-9]+)?)\s*(?:cm|mm)\b/i);
  const wys = oneLine.match(/wysokości?\s*[:\-–—]?\s*([0-9]+(?:[\s,\.][0-9]+)?)\s*(?:cm|mm)\b/i);
  if (szer?.[1] && wys?.[1]) {
    return trimLabel(`${szer[1]} × ${wys[1]} cm`);
  }

  return null;
}

/** Linia „Wymiary: …” lub „Wymiary — …” w polu specyfikacja (Medusa metadata). */
function extractFromSpecyfikacja(spec: string): string | null {
  const trimmed = spec.trim();
  if (!trimmed) return null;

  for (const line of trimmed.split(/\r?\n/)) {
    const t = line.trim();
    const m = t.match(/^Wymiary\s*[:\-–—]\s*(.+)$/i);
    if (m) return m[1].trim();
  }

  const inline = trimmed.match(/Wymiary\s*[:\-–—]\s*([^\n]+?)(?:\n|$)/i);
  if (inline) return inline[1].trim();

  return null;
}

/**
 * Wymiary do zapisu w Medusa `metadata.wymiary`: z opisu (HTML) i/lub pola specyfikacja.
 * Używane przez skrypt `scripts/fill-product-dimensions-from-description.ts`.
 */
export function extractDimensionsFromProductDescription(
  description: string | null | undefined,
  specyfikacja: string | null | undefined,
): string | null {
  if (typeof description === "string" && description.trim()) {
    const fromHtml = extractDimensionsFromPlainText(stripHtmlForDimensions(description));
    if (fromHtml) return fromHtml;
  }

  if (typeof specyfikacja === "string" && specyfikacja.trim()) {
    const spec = specyfikacja.trim();
    const fromSpecLine = extractFromSpecyfikacja(spec);
    if (fromSpecLine) return fromSpecLine;
    const fromSpecPlain = extractDimensionsFromPlainText(
      stripHtmlForDimensions(spec),
    );
    if (fromSpecPlain) return fromSpecPlain;
  }

  return null;
}

/**
 * Etykieta wymiarów: metadata produktu / wariantu, ewentualnie wyciąg z `specyfikacja`.
 */
export function getProductDimensionsLabel(
  productMetadata: Record<string, unknown> | undefined | null,
  variantMetadata?: Record<string, unknown> | null,
): string | null {
  const fromProduct = pickFromRecord(productMetadata ?? null);
  if (fromProduct) return fromProduct;

  const spec = productMetadata?.specyfikacja;
  if (typeof spec === "string") {
    const fromSpec = extractFromSpecyfikacja(spec);
    if (fromSpec) return fromSpec;
  }

  return pickFromRecord(variantMetadata ?? null);
}
