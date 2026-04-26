"use client";

import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { CartConfiguratorDetails } from "@/components/cart/CartConfiguratorDetails";
import { formatPrice } from "@/lib/utils";
import { trackRemoveFromCart } from "@/lib/analytics/events";

interface CartItemData {
  id: string;
  title: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  total: number;
  metadata?: Record<string, string>;
  /**
   * Wstawione przez CartProvider dla pozycji dodanych optymistycznie
   * (przed potwierdzeniem z backendu). Blokujemy wtedy przyciski ilość/usuń,
   * bo `id` ma prefix "optimistic:" i backend go nie zna — próba update'u
   * poleciałaby jako 404.
   */
  optimistic?: boolean;
}

/** Szczegóły konfiguratora poza kolorami — w `CartConfiguratorDetails`. */
function hasExtraConfiguratorDetail(meta: Record<string, string>): boolean {
  if (meta.custom_text?.trim()) return true;
  if (Object.keys(meta).some((k) => k.startsWith("text_") && meta[k]?.trim())) return true;
  if (Object.keys(meta).some((k) => k.startsWith("link_") && meta[k]?.trim())) return true;
  if (Object.keys(meta).some((k) => k.startsWith("file_") && meta[k]?.trim())) return true;
  if (meta.mat_finish === "true") return true;
  return false;
}

function hasPerElementColors(meta: Record<string, string>): boolean {
  return Object.keys(meta).some((k) => k.startsWith("color_"));
}

export function CartItem({ item }: { item: CartItemData }) {
  const { updateItem, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const isOptimistic = item.optimistic === true;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (isOptimistic) return;
    setIsUpdating(true);
    try {
      await updateItem(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isOptimistic) return;
    setIsUpdating(true);
    trackRemoveFromCart({ id: item.id, title: item.title, price: item.total });
    try {
      await removeItem(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const busy = isUpdating || isOptimistic;

  return (
    <div className="relative overflow-hidden">
      <div
        className={`relative flex gap-4 bg-white py-4 transition-all ${busy ? "opacity-60" : ""}`}
      >
        {/* Thumbnail */}
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-brand-50">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-brand-300">
              Brak zdjęcia
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg leading-snug text-brand-800 line-clamp-2">
                {item.title}
              </h3>
              <CartConfiguratorDetails metadata={item.metadata} />
              {item.metadata && hasExtraConfiguratorDetail(item.metadata) && (
                <div className="mt-1 space-y-0.5">
                  {item.metadata.custom_text && (
                    <p className="text-[13px] text-brand-400 truncate">
                      Treść: &ldquo;{item.metadata.custom_text}&rdquo;
                    </p>
                  )}
                  {Object.entries(item.metadata)
                    .filter(([k, v]) => k.startsWith("text_") && v)
                    .map(([key, value]) => (
                      <p key={key} className="text-[13px] text-brand-400 truncate">
                        {key.replace("text_", "").replace(/_/g, " ")}: &ldquo;{value}&rdquo;
                      </p>
                    ))}
                  {item.metadata.mat_finish === "true" && !hasPerElementColors(item.metadata) && (
                    <p className="text-[13px] text-brand-400">Wykończenie: mat</p>
                  )}
                  {/* Links */}
                  {Object.entries(item.metadata)
                    .filter(([k]) => k.startsWith("link_"))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, url]) => (
                      <p key={key} className="text-[13px] text-brand-400 truncate">
                        QR {key.replace("link_", "#")}: {url}
                      </p>
                    ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="shrink-0 rounded-full p-1 text-brand-300 transition-colors hover:bg-brand-50 hover:text-red-500 disabled:cursor-not-allowed"
              aria-label={`Usuń ${item.title}`}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            {/* Quantity stepper */}
            <div className="inline-flex items-center rounded-full border border-brand-200">
              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={busy || item.quantity <= 1}
                className="flex h-7 w-7 items-center justify-center text-brand-500 transition-colors hover:text-brand-800 disabled:opacity-30"
                aria-label="Zmniejsz ilość"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center text-xs font-medium tabular-nums text-brand-700">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={busy}
                className="flex h-7 w-7 items-center justify-center text-brand-500 transition-colors hover:text-brand-800 disabled:opacity-30"
                aria-label="Zwiększ ilość"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Price */}
            <span className="text-base font-medium tabular-nums text-brand-800">
              {formatPrice(item.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
