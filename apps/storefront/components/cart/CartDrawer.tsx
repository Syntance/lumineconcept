"use client";

import Link from "next/link";
import { X, ShoppingBag, ArrowRight, Gift } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartUpsell } from "./CartUpsell";
import { ExpressToggle } from "./ExpressToggle";
import { trackReferralApplied, trackCartViewed } from "@/lib/analytics/events";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    itemCount,
    applyDiscount,
    expressDelivery,
  } = useCart();

  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [referralMessage, setReferralMessage] = useState("");
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }

    if (!prevOpenRef.current) {
      trackCartViewed(items.map((i) => i.id));
      const savedCode = localStorage.getItem("lumine_referral");
      if (savedCode && referralStatus === "idle") setReferralCode(savedCode);
      prevOpenRef.current = true;
    }

    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, closeCart, referralStatus, items]);

  const handleApplyReferral = useCallback(async () => {
    if (!referralCode.trim()) return;
    setReferralStatus("loading");
    try {
      if (applyDiscount) await applyDiscount(referralCode.trim());
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
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-brand-900/40"
        style={{ animation: "cartFadeIn 200ms ease-out" }}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white shadow-2xl"
        style={{ animation: "cartSlideIn 300ms ease-out" }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="font-display text-[24px] font-semibold tracking-wide text-brand-800">
            Koszyk
            {itemCount > 0 && (
              <span className="ml-2 align-middle text-xl font-normal text-brand-400">({itemCount})</span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="-mr-2 rounded-full p-2 text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-800"
            aria-label="Zamknij koszyk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="h-px bg-brand-100" />

        {items.length === 0 ? (
          /* ── Empty state ── */
          <div className="relative flex flex-1 flex-col items-center justify-center px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
              <ShoppingBag className="h-8 w-8 text-brand-300" strokeWidth={1.5} />
            </div>
            <p className="mt-6 font-sans text-base tracking-wide text-brand-700">
              Koszyk jest pusty
            </p>
            <p className="mt-2 text-center text-sm text-brand-400">
              Przeglądaj nasze produkty i znajdź coś idealnego dla siebie
            </p>
            <Link
              href="/sklep/gotowe-wzory"
              onClick={closeCart}
              className="absolute bottom-[20%] inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-600 transition-colors hover:text-brand-900"
            >
              Przeglądaj sklep
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          /* ── Items ── */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-brand-50 px-6">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              {/* Ekspress + kupon: zawsze tuż pod produktami */}
              <div className="mx-6 mt-4 space-y-3">
                <ExpressToggle />

                <div className="rounded-lg border border-brand-100 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-brand-400" />
                    <span className="text-xs font-medium tracking-wide text-brand-600">
                      Kod rabatowy
                    </span>
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
                      className="flex-1 rounded-md border border-brand-200 bg-transparent px-3 py-2 text-xs text-brand-700 placeholder:text-brand-300 focus:border-brand-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyReferral}
                      disabled={
                        referralStatus === "loading" || referralStatus === "success"
                      }
                      className="shrink-0 rounded-md bg-brand-800 px-4 py-2 text-xs font-medium tracking-wide text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
                    >
                      {referralStatus === "loading" ? "..." : "Zastosuj"}
                    </button>
                  </div>
                  {referralMessage && (
                    <p
                      className={`mt-2 text-[11px] ${referralStatus === "success" ? "text-green-600" : "text-red-500"}`}
                    >
                      {referralMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Upsell: ładuje się async — na dole, nie przesuwa ważnych elementów */}
              <div className="px-6 pt-4 pb-4">
                <CartUpsell currentItemIds={items.map((i) => i.variant_id ?? i.id)} />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-brand-100">
              <div className="px-6 pt-5 pb-2">
                <CartSummary />
              </div>

              <div className="space-y-2.5 px-6 pb-6">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-900 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-brand-800"
                >
                  Zamów teraz
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/koszyk"
                  onClick={closeCart}
                  className="block w-full py-2 text-center text-xs font-medium tracking-wide text-brand-500 transition-colors hover:text-brand-800"
                >
                  lub zobacz pełny koszyk
                </Link>
              </div>

              {/* Micro trust */}
              <div className="flex items-center justify-center gap-4 border-t border-brand-50 px-6 py-3 text-[10px] uppercase tracking-widest text-brand-400">
                <span>Bezpieczna płatność</span>
                <span className="text-brand-200">·</span>
                <span>
                  {expressDelivery
                    ? "Ekspress: 3 dni robocze"
                    : "Realizacja ok. 10 dni roboczych"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
