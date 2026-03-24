"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";

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
    try {
      await removeItem(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`flex gap-4 ${isUpdating ? "opacity-60" : ""}`}>
      <div className="h-20 w-20 flex-shrink-0 rounded-md bg-brand-50 overflow-hidden">
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
            className="p-1 text-brand-400 hover:text-red-600 transition-colors"
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
  );
}
