import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Strona nie znaleziona",
};

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-display text-6xl font-bold text-brand-900">404</h1>
      <p className="mt-4 text-lg text-brand-600">
        Strona, której szukasz, nie istnieje.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
      >
        Wróć do strony głównej
      </Link>
    </main>
  );
}
