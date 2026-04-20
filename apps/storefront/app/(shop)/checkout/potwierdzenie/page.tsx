import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Potwierdzenie zamówienia",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{ order_id?: string; display_id?: string }>;
}

export default async function OrderConfirmationPage({ searchParams }: PageProps) {
  const { order_id: orderId, display_id: displayId } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-6 font-display text-3xl font-bold text-brand-800">
        Dziękujemy za zamówienie!
      </h1>
      <p className="mx-auto mt-4 max-w-md text-brand-600">
        Twoje zamówienie zostało przyjęte. Potwierdzenie zostanie wysłane na podany
        adres email. Możesz śledzić status zamówienia w swoim panelu klienta.
      </p>

      {(orderId || displayId) && (
        <div className="mx-auto mt-6 inline-flex flex-col gap-1 rounded-lg border border-brand-100 bg-brand-50 px-6 py-4 text-left">
          {displayId && (
            <p className="text-sm text-brand-600">
              Numer zamówienia:{" "}
              <span className="font-semibold text-brand-900">#{displayId}</span>
            </p>
          )}
          {orderId && (
            <p className="text-xs text-brand-500">
              ID Medusy: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/sklep"
          className="rounded-md bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
        >
          Kontynuuj zakupy
        </Link>
        <Link
          href="/"
          className="rounded-md border border-brand-300 px-8 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50 transition-colors"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
