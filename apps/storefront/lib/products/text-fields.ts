export interface TextFieldDef {
  key: string;
  label: string;
  /** Krótki opis widoczny pod labelem — wyjaśnia, którego elementu produktu dotyczy pole. */
  hint?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
}

export function isValidTextField(f: unknown): f is TextFieldDef {
  if (!f || typeof f !== "object") return false;
  const obj = f as Record<string, unknown>;
  return typeof obj.key === "string" && typeof obj.label === "string";
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
