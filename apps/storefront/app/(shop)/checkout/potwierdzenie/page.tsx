import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { PurchaseTracking, type PurchaseTrackingOrder } from "@/components/analytics/PurchaseTracking";
import { CheckoutConfirmationGuard } from "@/components/checkout/CheckoutConfirmationGuard";
import { BankTransferInstructions } from "@/components/checkout/BankTransferInstructions";
import { getOrder } from "@/lib/medusa/order";

export const metadata: Metadata = {
  title: "Potwierdzenie zamówienia",
  robots: { index: false },
};

interface PageProps {
  searchParams: Promise<{
    order_id?: string;
    display_id?: string;
    payment?: string;
  }>;
}

export default async function OrderConfirmationPage({ searchParams }: PageProps) {
  const { order_id: orderId, display_id: displayIdQuery, payment } =
    await searchParams;
  const isBankTransfer = payment === "bank_transfer";

  let orderAmount: number | undefined;
  let displayId = displayIdQuery;
  let purchaseTrackingOrder: PurchaseTrackingOrder | null = null;

  if (orderId) {
    const order = await getOrder(orderId);
    if (order) {
      orderAmount = order.total;
      if (!displayId && order.display_id) {
        displayId = String(order.display_id);
      }

      if (order.total != null && order.items.length > 0) {
        purchaseTrackingOrder = {
          orderId: order.id,
          displayId: order.display_id,
          total: order.total,
          currency: (order.currency_code ?? "PLN").toUpperCase(),
          email: order.email,
          paymentMethod: isBankTransfer ? "bank_transfer" : payment,
          items: order.items,
        };
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <CheckoutConfirmationGuard orderId={orderId} displayId={displayId} />
      {purchaseTrackingOrder ? (
        <PurchaseTracking order={purchaseTrackingOrder} />
      ) : null}
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-6 font-display text-3xl font-bold text-brand-800">
        {isBankTransfer ? "Zamówienie przyjęte — opłać przelewem" : "Dziękujemy za zamówienie!"}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-brand-600">
        {isBankTransfer
          ? "Twoje zamówienie czeka na wpłatę. Po zaksięgowaniu przelewu wyślemy potwierdzenie e-mailem i rozpoczniemy realizację."
          : "Twoje zamówienie zostało przyjęte. Szczegóły i potwierdzenie prześlemy na podany adres e-mail."}
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

      {isBankTransfer ? (
        <BankTransferInstructions displayId={displayId} amount={orderAmount} />
      ) : null}

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
