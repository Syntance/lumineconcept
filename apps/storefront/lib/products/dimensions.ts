const DIRECT_KEYS = [
  "wymiary",
  "dimensions",
  "Wymiary",
  "rozmiar",
  "size",
  "wymiary_cm",
] as const;

/** Grubość (plexi / materiał) — metadata Medusa / wariant */
const PLEXI_THICKNESS_KEYS = [
  "grubosc",
  "grubość",
  "grubosc_plexi",
  "grubość_plexi",
  "plexi_thickness",
  "plexi_grubosc",
  "plexi_grubość",
  "thickness_plexi",
] as const;

const WIDTH_KEYS = [
  "szerokosc",
  "szerokość",
  "width",
  "szerokosc_cm",
  "szerokość_cm",
] as const;

const HEIGHT_KEYS = [
  "wysokosc",
  "wysokość",
  "height",
  "wysokosc_cm",
  "wysokość_cm",
] as const;

function pickDimensionField(
  meta: Record<string, unknown> | null | undefined,
  keys: readonly string[],
): string | null {
  if (!meta) return null;
  for (const key of keys) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Rozdziela „23 × 25 cm”, „23x25mm”, „Wymiary: 23X25 cm” itd. na dwie wartości.
 * Obsługuje × (U+00D7), x/X, usuwa prefiks „Wymiary:”, normalizuje twarde spacje.
 */
export function parseWidthHeightFromDimensionsLabel(
  s: string,
): { width: string | null; height: string | null } {
  if (!s || typeof s !== "string") return { width: null, height: null };
  let t = s.trim().replace(/\u00a0/g, " ");
  t = t.replace(/<[^>]+>/g, " ");
  t = t.replace(/^Wymiary\s*[:\-–—]?\s*/i, "").trim();
  // Znaki mnożenia / podobne → x (łatwiejszy jeden wzorzec)
  t = t.replace(/[\u00D7\u2715\u2716]/g, "x");

  const m = t.match(
    /([0-9]+(?:[\s,\.][0-9]+)?)\s*[xX]\s*([0-9]+(?:[\s,\.][0-9]+)?)\s*(cm|mm)?/i,
  );
  if (!m) return { width: null, height: null };
  const unit = (m[3] ?? "cm").trim();
  return {
    width: `${m[1].replace(/\s/g, "")} ${unit}`,
    height: `${m[2].replace(/\s/g, "")} ${unit}`,
  };
}

export interface ProductDimensionParts {
  width: string | null;
  height: string | null;
  thickness: string | null;
  /** gdy nie da się rozdzielić na szer./wys. (np. nietypowy opis) */
  dimensionsFallback: string | null;
}

/**
 * Jedna linia „szer × wys [jednostka]” (np. „23 × 25 cm”) zamiast osobnych etykiet.
 * Gdy jednostki się różnią lub format nietypowy — łączy przez „ × ”.
 */
export function formatDimensionsWxH(
  width: string | null,
  height: string | null,
): string | null {
  if (width && height) {
    const w = width.trim();
    const h = height.trim();
    const re = /^([\d\s,\.]+)\s*(cm|mm|m)\s*$/i;
    const mw = w.match(re);
    const mh = h.match(re);
    if (mw && mh && mw[2].toLowerCase() === mh[2].toLowerCase()) {
      const nw = mw[1].replace(/\s/g, "").replace(",", ".");
      const nh = mh[1].replace(/\s/g, "").replace(",", ".");
      return `${nw} × ${nh} ${mw[2]}`;
    }
    return `${w} × ${h}`;
  }
  if (width) return width.trim();
  if (height) return height.trim();
  return null;
}

/**
 * Wymiary pod PDP: osobno szerokość, wysokość, grubość — z metadata lub z parsowania `wymiary`.
 */
export function getProductDimensionParts(
  productMetadata: Record<string, unknown> | undefined | null,
  variantMetadata?: Record<string, unknown> | null,
): ProductDimensionParts {
  const meta = (productMetadata ?? {}) as Record<string, unknown>;
  const variant = (variantMetadata ?? null) as Record<string, unknown> | null;

  const widthDirect =
    pickDimensionField(meta, WIDTH_KEYS) ?? pickDimensionField(variant, WIDTH_KEYS);
  const heightDirect =
    pickDimensionField(meta, HEIGHT_KEYS) ?? pickDimensionField(variant, HEIGHT_KEYS);

  const combined = getProductDimensionsLabel(productMetadata, variantMetadata);
  const parsed = combined ? parseWidthHeightFromDimensionsLabel(combined) : { width: null, height: null };

  const width = widthDirect ?? parsed.width;
  const height = heightDirect ?? parsed.height;

  const thickness = getProductPlexiThicknessLabel(productMetadata, variantMetadata);

  const dimensionsFallback =
    combined && !width && !height ? combined : null;

  return {
    width,
    height,
    thickness,
    dimensionsFallback,
  };
}

function pickPlexiThicknessFromRecord(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  if (!meta) return null;
  for (const key of PLEXI_THICKNESS_KEYS) {
    const v = meta[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  for (const [k, v] of Object.entries(meta)) {
    const kl = k.toLowerCase();
    if (
      (kl.includes("plexi") && kl.includes("grub")) &&
      typeof v === "string" &&
      v.trim()
    ) {
      return v.trim();
    }
  }
  return null;
}

function extractPlexiThicknessFromSpecyfikacja(spec: string): string | null {
  const trimmed = spec.trim();
  if (!trimmed) return null;

  for (const line of trimmed.split(/\r?\n/)) {
    const t = line.trim();
    const plexi = t.match(/^Grubość\s+plexi\s*[:\-–—]\s*(.+)$/i);
    if (plexi) return plexi[1].trim();
    const plain = t.match(/^Grubość\s*[:\-–—]\s*(.+)$/i);
    if (plain) return plain[1].trim();
  }

  const inlinePlexi = trimmed.match(/Grubość\s+plexi\s*[:\-–—]\s*([^\n]+?)(?:\n|$)/i);
  if (inlinePlexi) return inlinePlexi[1].trim();
  const inline = trimmed.match(/Grubość\s*[:\-–—]\s*([^\n]+?)(?:\n|$)/i);
  if (inline) return inline[1].trim();

  return null;
}

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

/**
 * Grubość plexi: dedykowane klucze metadata lub linia „Grubość plexi: …” w specyfikacji.
 */
export function getProductPlexiThicknessLabel(
  productMetadata: Record<string, unknown> | undefined | null,
  variantMetadata?: Record<string, unknown> | null,
): string | null {
  const fromProduct = pickPlexiThicknessFromRecord(productMetadata ?? null);
  if (fromProduct) return fromProduct;

  const spec = productMetadata?.specyfikacja;
  if (typeof spec === "string") {
    const fromSpec = extractPlexiThicknessFromSpecyfikacja(spec);
    if (fromSpec) return fromSpec;
  }

  return pickPlexiThicknessFromRecord(variantMetadata ?? null);
}
