"use client";

import { useEffect, useState } from "react";
import { ProductVariantSelector } from "@/components/product/ProductVariantSelector";
import { AddToCartButton } from "@/components/product/AddToCartButton";
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

  const handleOptionChange = (optionTitle: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionTitle]: value }));
  };

  return (
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
  );
}
