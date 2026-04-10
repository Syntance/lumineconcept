import Link from "next/link";
import type { Metadata } from "next";
import { BackButton } from "@/components/common/BackButton";

export const metadata: Metadata = {
  title: "Strona nie znaleziona",
};

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-6xl font-bold text-brand-800">404</h1>
      <p className="mt-4 text-lg text-brand-600">
        Strona, której szukasz, nie istnieje.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <BackButton />
        <Link
          href="/sklep"
          className="rounded-md border border-brand-300 px-6 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50 transition-colors"
        >
          Przejdź do sklepu
        </Link>
      </div>
    </main>
  );
}
