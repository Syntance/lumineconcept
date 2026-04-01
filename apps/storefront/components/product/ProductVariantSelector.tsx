"use client";

import type { GlobalConfigOption } from "@/lib/products/global-config";

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
}

export const CUSTOM_COLOR_VALUE = "__custom__";

export interface ColorCustomizationForValidation {
  customColor: string | null;
}

export function isEveryColorOptionChosen(
  colorOptionTitles: string[],
  selectedOptions: Record<string, string>,
  colorCustomizations: Record<string, ColorCustomizationForValidation>,
): boolean {
  if (colorOptionTitles.length === 0) return true;
  for (const title of colorOptionTitles) {
    const v = selectedOptions[title] ?? "";
    if (!v.trim()) return false;
    if (v === CUSTOM_COLOR_VALUE) {
      const hex = colorCustomizations[title]?.customColor;
      if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
    }
  }
  return true;
}

export function isColorOption(title: string): boolean {
  return title.toLowerCase().startsWith("kolor");
}

export function isSizeOption(title: string): boolean {
  return title.toLowerCase() === "rozmiar";
}

export function isLedOption(title: string): boolean {
  return title.toLowerCase() === "led";
}

export function getColorHex(
  name: string,
  colorMap: Record<string, string>,
): string {
  return colorMap[name.toLowerCase()] ?? "#ccc";
}

export function isMirrorColor(
  value: string,
  mirrorSet: Set<string>,
): boolean {
  return mirrorSet.has(value.toLowerCase());
}

export function isMatAllowed(
  colorValue: string,
  matDisabledSet: Set<string>,
): boolean {
  const t = colorValue.trim();
  if (!t || t === CUSTOM_COLOR_VALUE) return false;
  return !matDisabledSet.has(t.toLowerCase());
}
