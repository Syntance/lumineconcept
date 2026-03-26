"use client";

import Link from "next/link";
import { X, ShoppingBag, Gift, Shield, Truck, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartUpsell } from "./CartUpsell";
import { trackReferralApplied, trackCartViewed } from "@/lib/analytics/events";

const FREE_SHIPPING_THRESHOLD = 29900;

function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (remaining <= 0) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-2.5 text-center text-sm text-green-700">
        <Truck className="inline-block mr-1.5 h-4 w-4" />
        Masz darmową wysyłkę!
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-100 px-4 py-3">
      <p className="text-xs text-brand-600 text-center mb-2">
        Brakuje <strong>{(remaining / 100).toFixed(0)} PLN</strong> do darmowej wysyłki
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { isOpen, closeCart, items, itemCount, subtotal, applyDiscount } = useCart();

  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [referralMessage, setReferralMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    trackCartViewed(items.map((i) => i.id));

    const savedCode = localStorage.getItem("lumine_referral");
    if (savedCode && referralStatus === "idle") {
      setReferralCode(savedCode);
    }

    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart, referralStatus, items]);

  const handleApplyReferral = useCallback(async () => {
    if (!referralCode.trim()) return;
    setReferralStatus("loading");
    try {
      if (applyDiscount) {
        await applyDiscount(referralCode.trim());
      }
      localStorage.setItem("lumine_referral", referralCode.trim());
      trackReferralApplied(referralCode.trim());
      setReferralStatus("success");
      setReferralMessage("Kod zastosowany!");
    } catch {
      setReferralStatus("error");
      setReferralMessage("Nieprawidłowy kod");
    }
  }, [referralCode, applyDiscount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Koszyk">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <h2 className="font-display text-lg font-semibold text-brand-800">
            Koszyk ({itemCount})
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 -mr-2 text-brand-700 hover:text-brand-900"
            aria-label="Zamknij koszyk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <ShoppingBag className="h-12 w-12 text-brand-200" />
            <p className="text-brand-500">Twój koszyk jest pusty</p>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-md bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-dark transition-colors"
            >
              Przeglądaj produkty
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <FreeShippingProgress subtotal={subtotal} />

              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}

              <CartUpsell currentItemIds={items.map((i) => i.variant_id ?? i.id)} />

              {/* Referral code */}
              <div className="rounded-lg border border-brand-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-brand-500" />
                  <span className="text-xs font-medium text-brand-700">Kod polecający</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value);
                      if (referralStatus !== "idle") setReferralStatus("idle");
                    }}
                    placeholder="Wpisz kod..."
                    className="flex-1 rounded-md border border-brand-200 px-3 py-1.5 text-xs text-brand-700 placeholder:text-brand-400 focus:border-brand-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyReferral}
                    disabled={referralStatus === "loading" || referralStatus === "success"}
                    className="shrink-0 rounded-md bg-brand-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-50 transition-colors"
                  >
                    {referralStatus === "loading" ? "..." : "Zastosuj"}
                  </button>
                </div>
                {referralMessage && (
                  <p className={`mt-1.5 text-[11px] ${referralStatus === "success" ? "text-green-600" : "text-red-600"}`}>
                    {referralMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-brand-100 p-4 space-y-4">
              {/* Trust badges */}
              <div className="flex justify-center gap-4 text-[11px] text-brand-500">
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Bezpieczna płatność</span>
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Wysyłka 1-3 dni</span>
                <span className="flex items-center gap-1"><RefreshCcw className="h-3.5 w-3.5" /> 14 dni zwrotu</span>
              </div>

              <CartSummary />
              <Link
                href="/koszyk"
                onClick={closeCart}
                className="block w-full rounded-md bg-accent py-3 text-center text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                Przejdź do koszyka
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full rounded-md border border-brand-900 bg-brand-900 py-3 text-center text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
              >
                Zamów teraz
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
