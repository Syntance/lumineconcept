"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import {
  ProductConfigurator,
  type ColorCustomization,
} from "@/components/product/ProductConfigurator";
import type { UploadedFile } from "@/components/product/FileUploadSection";
import {
  type TextFieldDef,
  parseTextFieldsFromMetadata,
} from "@/lib/products/text-fields";
import {
  CUSTOM_COLOR_VALUE,
  isColorOption,
  isEveryColorOptionChosen,
} from "@/components/product/ProductVariantSelector";
import {
  buildColorMap,
  buildColoredSet,
  buildMirrorSet,
  buildMatDisabledSet,
  type GlobalConfigOption,
} from "@/lib/products/global-config";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ExpressToggle } from "@/components/cart/ExpressToggle";
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
      /** false = bez śledzenia stanu (Medusa), zawsze można zamówić */
      manage_inventory?: boolean;
    }>;
    metadata?: Record<string, unknown>;
    images?: Array<{ id: string; url: string; alt?: string }>;
  };
  checkoutCallout?: CheckoutCallout | null;
  globalColors?: GlobalConfigOption[];
  schemaImageUrl?: string | null;
}

function extractMetaKey(optionTitle: string): string {
  const lower = optionTitle.toLowerCase().replace(/\s+/g, "_");
  if (lower === "kolor") return "kolor";
  return lower.replace(/^kolor_/, "");
}

export function ProductPageClient({
  product,
  checkoutCallout,
  globalColors = [],
  schemaImageUrl,
}: ProductPageClientProps) {
  const router = useRouter();

  const colorMap = useMemo(() => buildColorMap(globalColors), [globalColors]);
  const coloredSet = useMemo(() => buildColoredSet(globalColors), [globalColors]);
  const mirrorSet = useMemo(() => buildMirrorSet(globalColors), [globalColors]);
  const matDisabledSet = useMemo(() => buildMatDisabledSet(globalColors), [globalColors]);

  const colorOptionTitles = useMemo(
    () => product.options.filter((o) => isColorOption(o.title)).map((o) => o.title),
    [product.options],
  );

  const nonColorOptions = useMemo(
    () => product.options.filter((o) => !isColorOption(o.title)),
    [product.options],
  );

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const title of colorOptionTitles) {
      initial[title] = "";
    }
    for (const option of nonColorOptions) {
      if (option.values[0]) {
        initial[option.title] = option.values[0];
      }
    }
    return initial;
  });

  const [colorCustomizations, setColorCustomizations] = useState<
    Record<string, ColorCustomization>
  >(() => {
    const initial: Record<string, ColorCustomization> = {};
    for (const title of colorOptionTitles) {
      initial[title] = { customColor: null, matFinish: false };
    }
    return initial;
  });

  const textFields = useMemo<TextFieldDef[]>(() => {
    return parseTextFieldsFromMetadata(product.metadata);
  }, [product.metadata]);

  const [textFieldValues, setTextFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setTextFieldValues((prev) => {
      const next: Record<string, string> = {};
      for (const f of textFields) {
        next[f.key] = prev[f.key] ?? "";
      }
      return next;
    });
  }, [textFields]);

  const handleTextFieldChange = useCallback((key: string, value: string) => {
    setTextFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const allTextFieldsValid = useMemo(() => {
    return textFields
      .filter((f) => f.required)
      .every((f) => (textFieldValues[f.key] ?? "").trim().length > 0);
  }, [textFields, textFieldValues]);

  const allColorChoicesComplete = useMemo(
    () =>
      isEveryColorOptionChosen(
        colorOptionTitles,
        selectedOptions,
        colorCustomizations,
      ),
    [colorOptionTitles, selectedOptions, colorCustomizations],
  );

  const linksCount = useMemo(() => {
    const raw = product.metadata?.links_count;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [product.metadata]);

  const [links, setLinks] = useState<string[]>(() =>
    Array.from({ length: linksCount }, () => ""),
  );

  const allLinksProvided = linksCount === 0 || links.slice(0, linksCount).every((l) => l.trim().length > 0);

  const uploadsCount = useMemo(() => {
    const enabledRaw = product.metadata?.uploads_enabled;
    if (enabledRaw !== "true" && enabledRaw !== true) return 0;
    const raw = product.metadata?.uploads_count;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.min(n, 5);
    return 5;
  }, [product.metadata]);

  const uploadsLabel = useMemo(() => {
    const raw = product.metadata?.uploads_label;
    return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
  }, [product.metadata]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [calloutAction, setCalloutAction] = useState<
    "cart" | "checkout" | null
  >(null);

  const selectedVariant = product.variants.find((variant) =>
    Object.entries(selectedOptions).every(([key, value]) => {
      if (isColorOption(key)) return true;
      return variant.options[key] === value;
    }),
  );

  const basePrice = useMemo(() => {
    const raw = product.metadata?.base_price;
    if (raw === undefined || raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [product.metadata]);

  const displayPrice = basePrice ?? selectedVariant?.price ?? 0;

  useEffect(() => {
    trackProductViewed({
      id: product.id,
      title: product.title,
      price: displayPrice,
      currency: "PLN",
    });
  }, [product.id, product.title, displayPrice]);

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

  const buildMetadata = useCallback(():
    | Record<string, string>
    | undefined => {
    const meta: Record<string, string> = {};

    for (const field of textFields) {
      const val = textFieldValues[field.key]?.trim();
      if (val) meta[`text_${field.key}`] = val;
    }

    for (const title of colorOptionTitles) {
      const key = extractMetaKey(title);
      const sel = selectedOptions[title];
      if (sel && sel !== CUSTOM_COLOR_VALUE) {
        meta[`color_${key}`] = sel;
      }
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

    uploadedFiles.forEach((f, i) => {
      if (f?.url) meta[`file_${i + 1}`] = f.url;
    });

    return Object.keys(meta).length > 0 ? meta : undefined;
  }, [textFields, textFieldValues, colorCustomizations, colorOptionTitles, selectedOptions, links, linksCount, uploadedFiles]);

  const calloutEnabled =
    checkoutCallout?.enabled !== false && !!checkoutCallout?.message;

  const handleBeforeAdd = useCallback(() => {
    if (calloutEnabled) {
      setCalloutAction("cart");
      return true;
    }
    return false;
  }, [calloutEnabled]);

  /** Medusa: manage_inventory === true → limit ze stanu; false/undefined → na zamówienie (bez limitu ze sklepu) */
  const tracksInventory = selectedVariant?.manage_inventory === true;
  const stockQty = selectedVariant?.inventory_quantity ?? 0;
  const availableToOrder =
    !!selectedVariant && (!tracksInventory || stockQty > 0);
  const maxOrderQty = !tracksInventory ? 99 : stockQty;

  const showValidationCallout =
    !allLinksProvided ||
    !allTextFieldsValid ||
    (!allColorChoicesComplete && colorOptionTitles.length > 0);

  return (
    <>
      <div className="space-y-6">
        <ProductConfigurator
          options={nonColorOptions}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
          colorCustomizations={colorCustomizations}
          onColorCustomizationChange={handleColorCustomizationChange}
          textFields={textFields}
          textFieldValues={textFieldValues}
          onTextFieldChange={handleTextFieldChange}
          linksCount={linksCount}
          links={links}
          onLinksChange={setLinks}
          uploadsCount={uploadsCount}
          uploadsLabel={uploadsLabel}
          uploadedFiles={uploadedFiles}
          onUploadedFilesChange={setUploadedFiles}
          globalColors={globalColors}
          colorOptionTitles={colorOptionTitles}
          colorMap={colorMap}
          coloredSet={coloredSet}
          mirrorSet={mirrorSet}
          matDisabledSet={matDisabledSet}
          schemaImageUrl={schemaImageUrl}
        />

        {selectedVariant && tracksInventory && stockQty > 5 && (
          <p className="flex items-center gap-1.5 text-sm text-green-700">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            W magazynie — realizacja ok. 10 dni roboczych
          </p>
        )}
        {selectedVariant && tracksInventory && stockQty > 0 && stockQty <= 5 && (
          <p className="flex items-center gap-1.5 text-sm text-orange-600 animate-pulse">
            <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
            Ostatnie {stockQty} szt. w magazynie!
          </p>
        )}
        {selectedVariant && tracksInventory && stockQty === 0 && (
          <p className="flex items-center gap-1.5 text-sm text-red-600">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
            Produkt chwilowo niedostępny
          </p>
        )}

        <div ref={ctaRef} className="space-y-4">
          {showValidationCallout && (
            <div
              className="flex gap-3 rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              role="status"
            >
              <AlertCircle
                className="h-5 w-5 shrink-0 text-red-600"
                aria-hidden
              />
              <div className="flex min-w-0 flex-col gap-1.5">
                {!allLinksProvided && (
                  <p>Uzupełnij wszystkie linki do kodów QR</p>
                )}
                {!allTextFieldsValid && (
                  <p>Uzupełnij wymagane pola tekstowe</p>
                )}
                {!allColorChoicesComplete && colorOptionTitles.length > 0 && (
                  <p>Wybierz kolor dla każdego elementu konfiguracji</p>
                )}
              </div>
            </div>
          )}
          <ExpressToggle />
          <AddToCartButton
            variantId={selectedVariant?.id ?? null}
            productData={{
              id: product.id,
              title: product.title,
              price: displayPrice,
              currency: "PLN",
            }}
            disabled={
              !selectedVariant ||
              !availableToOrder ||
              !allLinksProvided ||
              !allTextFieldsValid ||
              !allColorChoicesComplete
            }
            maxQuantity={maxOrderQty}
            onBeforeAdd={calloutEnabled ? handleBeforeAdd : undefined}
            metadata={buildMetadata()}
          />
        </div>
      </div>

      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 p-3 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="truncate text-base font-medium text-brand-800">
                {product.title}
              </p>
              <PriceDisplay amount={displayPrice} size="sm" />
            </div>
            <AddToCartButton
              variantId={selectedVariant?.id ?? null}
              productData={{
                id: product.id,
                title: product.title,
                price: displayPrice,
                currency: "PLN",
              }}
              disabled={
                !selectedVariant ||
                !availableToOrder ||
                !allLinksProvided ||
                !allTextFieldsValid ||
                !allColorChoicesComplete
              }
              compact
              onBeforeAdd={calloutEnabled ? handleBeforeAdd : undefined}
              metadata={buildMetadata()}
            />
          </div>
        </div>
      )}

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
