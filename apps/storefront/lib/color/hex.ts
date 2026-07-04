const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(value: string): boolean {
  return HEX6.test(value);
}

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (HEX6.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return null;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const normalized = normalizeHex(hex) ?? "#000000";
  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));

  let h: number;
  if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  return { h, s: s * 100, l: l * 100 };
}

function hueToRgb(p: number, q: number, t: number): number {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
}

export function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(100, Math.max(0, s)) / 100;
  const light = Math.min(100, Math.max(0, l)) / 100;

  if (sat === 0) {
    const channel = Math.round(light * 255);
    const hex = channel.toString(16).padStart(2, "0");
    return `#${hex}${hex}${hex}`;
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;

  const r = Math.round(hueToRgb(p, q, hue / 360 + 1 / 3) * 255);
  const g = Math.round(hueToRgb(p, q, hue / 360) * 255);
  const b = Math.round(hueToRgb(p, q, hue / 360 - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
