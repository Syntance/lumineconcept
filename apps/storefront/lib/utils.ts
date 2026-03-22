import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  amount: number,
  currency = "PLN",
  locale = "pl-PL",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatDate(
  date: string | Date,
  locale = "pl-PL",
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąàáâã]/g, "a")
    .replace(/[ćč]/g, "c")
    .replace(/[ę]/g, "e")
    .replace(/[ł]/g, "l")
    .replace(/[ńñ]/g, "n")
    .replace(/[óòôõ]/g, "o")
    .replace(/[ś]/g, "s")
    .replace(/[żź]/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumine.syntance.dev";
