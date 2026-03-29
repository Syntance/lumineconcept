"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductVariantSelector, CUSTOM_COLOR_VALUE, isMatAllowed } from "@/components/product/ProductVariantSelector";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { trackProductViewed } from "@/lib/analytics/events";

interface CheckoutCallout {
  enabled?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
}

interface ProductPageClientProps {
  product: {
    id: string;
    title: string;
    options: Array<{ id: string; title: string; values: string[] }>;
    variants: Array<{
      id: string;
      title: string;
      options: Record<string, string>;
      price: number;
      inventory_quantity: number;
    }>;
  };
  checkoutCallout?: CheckoutCallout | null;
}

export function ProductPageClient({ product, checkoutCallout }: ProductPageClientProps) {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const option of product.options) {
      if (option.values[0]) {
        initial[option.title] = option.values[0];
      }
    }
    return initial;
  });

  const [customText, setCustomText] = useState("");
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [matFinish, setMatFinish] = useState(false);

  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [calloutAction, setCalloutAction] = useState<"cart" | "checkout" | null>(null);

  const selectedVariant = product.variants.find((variant) =>
    Object.entries(selectedOptions).every(([key, value]) => {
      if (key === "Kolor" && value === CUSTOM_COLOR_VALUE) {
        return true;
      }
      return variant.options[key] === value;
    }),
  );

  useEffect(() => {
    trackProductViewed({
      id: product.id,
      title: product.title,
      price: selectedVariant?.price ?? 0,
      currency: "PLN",
    });
  }, [product.id, product.title, selectedVariant?.price]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!calloutAction) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalloutAction(null);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [calloutAction]);

  const handleOptionChange = (optionTitle: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionTitle]: value }));
    if (optionTitle === "Kolor") {
      if (value !== CUSTOM_COLOR_VALUE) {
        setCustomColor(null);
      }
      if (!isMatAllowed(value)) {
        setMatFinish(false);
      }
    }
  };

  const buildMetadata = useCallback((): Record<string, string> | undefined => {
    const meta: Record<string, string> = {};
    if (customText.trim()) meta.custom_text = customText.trim();
    if (customColor) meta.custom_color = customColor;
    if (matFinish) meta.mat_finish = "true";
    return Object.keys(meta).length > 0 ? meta : undefined;
  }, [customText, customColor, matFinish]);

  const calloutEnabled = checkoutCallout?.enabled !== false && !!checkoutCallout?.message;

  const handleBeforeAdd = useCallback(() => {
    if (calloutEnabled) {
      setCalloutAction("cart");
      return true;
    }
    return false;
  }, [calloutEnabled]);

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    if (calloutEnabled) {
      setCalloutAction("checkout");
    } else {
      router.push("/checkout");
    }
  };

  const qty = selectedVariant?.inventory_quantity ?? 0;

  return (
    <>
      <div className="space-y-6">
        <ProductVariantSelector
          options={product.options}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
          customColor={customColor}
          onCustomColorChange={setCustomColor}
          matFinish={matFinish}
          onMatFinishChange={setMatFinish}
        />

        <div>
          <label htmlFor="custom-text" className="mb-2 block text-sm font-medium text-brand-700">
            Twój tekst <span className="font-normal text-brand-400">(opcjonalnie)</span>
          </label>
          <textarea
            id="custom-text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Wpisz treść, np. nazwę salonu, imię…"
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:border-accent focus:outline-none"
          />
          {customText.length > 0 && (
            <p className="mt-1 text-right text-xs text-brand-400">{customText.length}/200</p>
          )}
        </div>

        {selectedVariant && qty > 5 && (
          <p className="flex items-center gap-1.5 text-sm text-green-700">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            W magazynie — wysyłka w 48h
          </p>
        )}
        {selectedVariant && qty > 0 && qty <= 5 && (
          <p className="flex items-center gap-1.5 text-sm text-orange-600 animate-pulse">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
            Ostatnie {qty} szt. w magazynie!
          </p>
        )}
        {selectedVariant && qty === 0 && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Produkt chwilowo niedostępny
          </p>
        )}

        <div ref={ctaRef} className="space-y-3">
          <AddToCartButton
            variantId={selectedVariant?.id ?? null}
            productData={{
              id: product.id,
              title: product.title,
              price: selectedVariant?.price ?? 0,
              currency: "PLN",
            }}
            disabled={!selectedVariant || qty === 0}
            maxQuantity={qty > 0 ? qty : undefined}
            onBeforeAdd={calloutEnabled ? handleBeforeAdd : undefined}
            metadata={buildMetadata()}
          />
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!selectedVariant || qty === 0}
            className="w-full rounded-md border border-brand-300 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Kup teraz
          </button>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 p-3 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-brand-800">
                {product.title}
              </p>
              <PriceDisplay amount={selectedVariant?.price ?? 0} size="sm" />
            </div>
            <AddToCartButton
              variantId={selectedVariant?.id ?? null}
              productData={{
                id: product.id,
                title: product.title,
                price: selectedVariant?.price ?? 0,
                currency: "PLN",
              }}
              disabled={!selectedVariant || qty === 0}
              compact
              onBeforeAdd={calloutEnabled ? handleBeforeAdd : undefined}
              metadata={buildMetadata()}
            />
          </div>
        </div>
      )}

      {/* Checkout Callout Modal */}
      {calloutAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setCalloutAction(null)}
          role="dialog"
          aria-modal="true"
          aria-label={checkoutCallout?.title ?? "Informacja"}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-brand-200 bg-white p-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {checkoutCallout?.title && (
              <h2 className="font-display text-lg tracking-wide text-brand-800">
                {checkoutCallout.title}
              </h2>
            )}
            {checkoutCallout?.message && (
              <p className="mt-3 text-sm leading-relaxed text-brand-600 whitespace-pre-line">
                {checkoutCallout.message}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const action = calloutAction;
                  setCalloutAction(null);
                  if (action === "checkout") {
                    router.push("/checkout");
                  } else if (action === "cart") {
                    window.dispatchEvent(new Event("callout-confirmed-cart"));
                  }
                }}
                className="w-full rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
              >
                {checkoutCallout?.confirmLabel ?? "Rozumiem, kontynuuj"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalloutAction(null);
                  window.dispatchEvent(new Event("callout-cancelled"));
                }}
                className="w-full rounded-md border border-brand-200 px-6 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
