export interface TextFieldDef {
  key: string;
  label: string;
  /** Krótki opis widoczny pod labelem — wyjaśnia, którego elementu produktu dotyczy pole. */
  hint?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

export function isValidTextField(f: unknown): f is TextFieldDef {
  if (!f || typeof f !== "object") return false;
  const obj = f as Record<string, unknown>;
  return typeof obj.key === "string" && typeof obj.label === "string";
}

export const MAX_TEXT_FIELDS = 10;

export function generateTextFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[ąàáâãä]/g, "a")
    .replace(/[ćçč]/g, "c")
    .replace(/[ęèéêë]/g, "e")
    .replace(/[łℓ]/g, "l")
    .replace(/[ńñ]/g, "n")
    .replace(/[óòôõö]/g, "o")
    .replace(/[śšş]/g, "s")
    .replace(/[żźž]/g, "z")
    .replace(/[ůüúùû]/g, "u")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function createDefaultTextField(index: number): TextFieldDef {
  const label = index === 0 ? "Tekst" : `Tekst ${index + 1}`;
  return {
    key: generateTextFieldKey(label) || `tekst_${index + 1}`,
    label,
    placeholder: "",
    required: false,
    maxLength: 200,
  };
}

export function serializeTextFieldsForMetadata(fields: TextFieldDef[]): TextFieldDef[] {
  return fields
    .filter((f) => f.key.trim() && f.label.trim())
    .map((f) => ({
      key: f.key.trim(),
      label: f.label.trim(),
      ...(f.hint?.trim() ? { hint: f.hint.trim() } : {}),
      ...(f.placeholder?.trim() ? { placeholder: f.placeholder } : {}),
      ...(f.required ? { required: true } : {}),
      ...(f.maxLength && f.maxLength !== 200 ? { maxLength: f.maxLength } : {}),
    }));
}

/** Pola z Medusa Admin → metadata `text_fields` (JSON string lub tablica). */
export function parseTextFieldsFromMetadata(
  metadata?: Record<string, unknown> | null,
): TextFieldDef[] {
  const raw = metadata?.text_fields;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(isValidTextField);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw.filter(isValidTextField);
  return [];
}
