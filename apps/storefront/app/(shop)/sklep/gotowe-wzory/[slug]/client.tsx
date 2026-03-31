"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProductConfigurator,
  type ColorCustomization,
  type ColorRegion,
  type TextFieldDef,
} from "@/components/product/ProductConfigurator";
import {
  CUSTOM_COLOR_VALUE,
  isColorOption,
} from "@/components/product/ProductVariantSelector";
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
    metadata?: Record<string, unknown>;
    images?: Array<{ id: string; url: string; alt?: string }>;
  };
  checkoutCallout?: CheckoutCallout | null;
}

function extractMetaKey(optionTitle: string): string {
  const lower = optionTitle.toLowerCase().replace(/\s+/g, "_");
  if (lower === "kolor") return "kolor";
  return lower.replace(/^kolor_/, "");
}

function isValidTextField(f: unknown): f is TextFieldDef {
  if (!f || typeof f !== "object") return false;
  const obj = f as Record<string, unknown>;
  return typeof obj.key === "string" && typeof obj.label === "string";
}

export function ProductPageClient({
  product,
  checkoutCallout,
}: ProductPageClientProps) {
  const router = useRouter();

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const option of product.options) {
      if (option.values[0]) {
        initial[option.title] = option.values[0];
      }
    }
    return initial;
  });

  const colorOptionTitles = useMemo(
    () => product.options.filter((o) => isColorOption(o.title)).map((o) => o.title),
    [product.options],
  );

  const [colorCustomizations, setColorCustomizations] = useState<
    Record<string, ColorCustomization>
  >(() => {
    const initial: Record<string, ColorCustomization> = {};
    for (const title of colorOptionTitles) {
      initial[title] = { customColor: null, matFinish: false };
    }
    return initial;
  });

  const [customText, setCustomText] = useState("");

  const textFields = useMemo<TextFieldDef[]>(() => {
    const raw = product.metadata?.text_fields;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(isValidTextField);
      } catch { /* ignore */ }
    }
    if (Array.isArray(raw)) return raw.filter(isValidTextField);
    return [];
  }, [product.metadata]);

  const [textFieldValues, setTextFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of textFields) initial[f.key] = "";
    return initial;
  });

  const handleTextFieldChange = useCallback((key: string, value: string) => {
    setTextFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allTextFieldsValid = useMemo(() => {
    return textFields
      .filter((f) => f.required)
      .every((f) => (textFieldValues[f.key] ?? "").trim().length > 0);
  }, [textFields, textFieldValues]);

  const linksCount = useMemo(() => {
    const raw = product.metadata?.links_count;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [product.metadata]);

  const [links, setLinks] = useState<string[]>(() =>
    Array.from({ length: linksCount }, () => ""),
  );

  const allLinksProvided = linksCount === 0 || links.slice(0, linksCount).every((l) => l.trim().length > 0);

  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [calloutAction, setCalloutAction] = useState<
    "cart" | "checkout" | null
  >(null);

  const selectedVariant = product.variants.find((variant) =>
    Object.entries(selectedOptions).every(([key, value]) => {
      if (isColorOption(key) && value === CUSTOM_COLOR_VALUE) {
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
  };

  const handleColorCustomizationChange = (
    optionTitle: string,
    field: "customColor" | "matFinish",
    value: string | boolean | null,
  ) => {
    setColorCustomizations((prev) => ({
      ...prev,
      [optionTitle]: {
        ...prev[optionTitle],
        [field]: value,
      },
    }));
  };

  const colorRegions = useMemo<ColorRegion[]>(() => {
    const raw = product.metadata?.colorRegions;
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (r): r is ColorRegion =>
        typeof r === "object" &&
        r !== null &&
        typeof (r as ColorRegion).name === "string" &&
        typeof (r as ColorRegion).maskUrl === "string",
    );
  }, [product.metadata]);

  const baseImageUrl = useMemo(() => {
    const fromMeta = product.metadata?.configuratorBaseImage;
    if (typeof fromMeta === "string" && fromMeta) return fromMeta;
    return product.images?.[0]?.url ?? null;
  }, [product.metadata, product.images]);

  const buildMetadata = useCallback(():
    | Record<string, string>
    | undefined => {
    const meta: Record<string, string> = {};
    if (customText.trim()) meta.custom_text = customText.trim();

    for (const field of textFields) {
      const val = textFieldValues[field.key]?.trim();
      if (val) meta[`text_${field.key}`] = val;
    }

    for (const title of colorOptionTitles) {
      const key = extractMetaKey(title);
      const cust = colorCustomizations[title];
      if (cust?.customColor) {
        meta[`color_${key}_custom`] = cust.customColor;
      }
      if (cust?.matFinish) {
        meta[`color_${key}_mat`] = "true";
      }
    }

    for (let i = 0; i < linksCount; i++) {
      const url = links[i]?.trim();
      if (url) meta[`link_${i + 1}`] = url;
    }

    return Object.keys(meta).length > 0 ? meta : undefined;
  }, [customText, textFields, textFieldValues, colorCustomizations, colorOptionTitles, links, linksCount]);

  const calloutEnabled =
    checkoutCallout?.enabled !== false && !!checkoutCallout?.message;

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
        <ProductConfigurator
          options={product.options}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
          colorCustomizations={colorCustomizations}
          onColorCustomizationChange={handleColorCustomizationChange}
          customText={customText}
          onCustomTextChange={setCustomText}
          textFields={textFields}
          textFieldValues={textFieldValues}
          onTextFieldChange={handleTextFieldChange}
          linksCount={linksCount}
          links={links}
          onLinksChange={setLinks}
          baseImageUrl={baseImageUrl}
          colorRegions={colorRegions}
        />

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
            disabled={!selectedVariant || qty === 0 || !allLinksProvided || !allTextFieldsValid}
            maxQuantity={qty > 0 ? qty : undefined}
            onBeforeAdd={calloutEnabled ? handleBeforeAdd : undefined}
            metadata={buildMetadata()}
          />
          {!allLinksProvided && (
            <p className="text-xs text-red-500 text-center">
              Uzupełnij wszystkie linki do kodów QR
            </p>
          )}
          {!allTextFieldsValid && (
            <p className="text-xs text-red-500 text-center">
              Uzupełnij wymagane pola tekstowe
            </p>
          )}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!selectedVariant || qty === 0 || !allLinksProvided || !allTextFieldsValid}
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
              <p className="truncate text-base font-medium text-brand-800">
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
              disabled={!selectedVariant || qty === 0 || !allLinksProvided || !allTextFieldsValid}
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
