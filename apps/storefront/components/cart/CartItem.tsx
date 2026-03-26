"use client";

import { Trash2, Loader2 } from "lucide-react";
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
    if (swipeOffset < -60) {
      handleRemove();
    }
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Red background behind swipe */}
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center bg-red-500 text-white text-xs font-medium">
        Usuń
      </div>

      <div
        className={`relative flex gap-4 bg-white transition-transform ${isUpdating ? "opacity-60" : ""}`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-20 w-20 shrink-0 rounded-md bg-brand-50 overflow-hidden">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-300 text-xs">
              Brak zdjęcia
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-brand-800 line-clamp-2">
              {item.title}
            </h3>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUpdating}
              className="hidden sm:block p-1 text-brand-400 hover:text-red-600 transition-colors"
              aria-label={`Usuń ${item.title}`}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded border border-brand-200">
              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="px-2 py-1 text-xs text-brand-700 disabled:opacity-30"
                aria-label="Zmniejsz ilość"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-medium tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating}
                className="px-2 py-1 text-xs text-brand-700"
                aria-label="Zwiększ ilość"
              >
                +
              </button>
            </div>
            <span className="text-sm font-medium tabular-nums text-brand-800">
              {formatPrice(item.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
