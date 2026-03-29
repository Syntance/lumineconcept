"use client";

import { Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
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
}

export function CartItem({ item }: { item: CartItemData }) {
  const { updateItem, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    try {
      await updateItem(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    trackRemoveFromCart({ id: item.id, title: item.title, price: item.total });
    try {
      await removeItem(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    if (dx < 0) setSwipeOffset(Math.max(-100, dx));
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -60) handleRemove();
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe-to-delete background */}
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-red-500 text-[11px] font-medium uppercase tracking-wide text-white">
        Usuń
      </div>

      <div
        className={`relative flex gap-4 bg-white py-4 transition-all ${isUpdating ? "opacity-50" : ""}`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              <h3 className="text-sm leading-snug text-brand-800 line-clamp-2">
                {item.title}
              </h3>
              {(item.metadata?.custom_text || item.metadata?.custom_color || item.metadata?.mat_finish) && (
                <div className="mt-1 space-y-0.5">
                  {item.metadata.custom_text && (
                    <p className="text-xs text-brand-400 truncate">
                      Treść: &ldquo;{item.metadata.custom_text}&rdquo;
                    </p>
                  )}
                  {item.metadata.custom_color && (
                    <p className="flex items-center gap-1.5 text-xs text-brand-400">
                      Kolor:
                      <span
                        className="inline-block h-3 w-3 rounded-sm border border-brand-200"
                        style={{ backgroundColor: item.metadata.custom_color }}
                      />
                      <span className="font-mono text-[10px]">{item.metadata.custom_color}</span>
                    </p>
                  )}
                  {item.metadata.mat_finish === "true" && (
                    <p className="text-xs text-brand-400">Wykończenie: mat</p>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUpdating}
              className="shrink-0 rounded-full p-1 text-brand-300 transition-colors hover:bg-brand-50 hover:text-red-500"
              aria-label={`Usuń ${item.title}`}
            >
              {isUpdating ? (
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
                disabled={isUpdating || item.quantity <= 1}
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
                disabled={isUpdating}
                className="flex h-7 w-7 items-center justify-center text-brand-500 transition-colors hover:text-brand-800"
                aria-label="Zwiększ ilość"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Price */}
            <span className="text-sm font-medium tabular-nums text-brand-800">
              {formatPrice(item.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
