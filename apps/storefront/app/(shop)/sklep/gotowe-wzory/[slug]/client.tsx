"use client";

import { useEffect, useRef, useState } from "react";
import { ProductVariantSelector } from "@/components/product/ProductVariantSelector";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { trackProductViewed } from "@/lib/analytics/events";

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
}

export function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const option of product.options) {
      if (option.values[0]) {
        initial[option.title] = option.values[0];
      }
    }
    return initial;
  });

  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  const selectedVariant = product.variants.find((variant) =>
    Object.entries(selectedOptions).every(
      ([key, value]) => variant.options[key] === value,
    ),
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

  const handleOptionChange = (optionTitle: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionTitle]: value }));
  };

  return (
    <>
      <div className="space-y-6">
        <ProductVariantSelector
          options={product.options}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
        />

        {selectedVariant && selectedVariant.inventory_quantity <= 5 && selectedVariant.inventory_quantity > 0 && (
          <p className="text-sm text-orange-600">
            Ostatnie {selectedVariant.inventory_quantity} szt. w magazynie!
          </p>
        )}

        {selectedVariant && selectedVariant.inventory_quantity === 0 && (
          <p className="text-sm text-red-600">Produkt chwilowo niedostępny</p>
        )}

        <div ref={ctaRef}>
          <AddToCartButton
            variantId={selectedVariant?.id ?? null}
            productData={{
              id: product.id,
              title: product.title,
              price: selectedVariant?.price ?? 0,
              currency: "PLN",
            }}
            disabled={!selectedVariant || selectedVariant.inventory_quantity === 0}
          />
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
              disabled={!selectedVariant || selectedVariant.inventory_quantity === 0}
              compact
            />
          </div>
        </div>
      )}
    </>
  );
}
