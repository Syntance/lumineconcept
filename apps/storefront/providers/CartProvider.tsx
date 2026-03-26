"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as cartApi from "@/lib/medusa/cart";

interface CartItem {
  id: string;
  variant_id: string;
  title: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface CartState {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  itemCount: number;
}

interface CartContextType extends CartState {
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
}

const CART_ID_KEY = "lumine_cart_id";

const CartContext = createContext<CartContextType | null>(null);

function mapCartItems(items: Array<Record<string, unknown>>): CartItem[] {
  return items.map((item) => ({
    id: item.id as string,
    variant_id: item.variant_id as string,
    title: item.title as string,
    thumbnail: item.thumbnail as string | undefined,
    quantity: item.quantity as number,
    unit_price: item.unit_price as number,
    total: item.total as number,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartState>({
    id: null,
    items: [],
    subtotal: 0,
    shipping_total: 0,
    tax_total: 0,
    total: 0,
    itemCount: 0,
  });

  const updateCartState = useCallback(
    (rawCart: Record<string, unknown>) => {
      const items = mapCartItems(
        (rawCart.items as Array<Record<string, unknown>>) ?? [],
      );
      setCart({
        id: rawCart.id as string,
        items,
        subtotal: (rawCart.subtotal as number) ?? 0,
        shipping_total: (rawCart.shipping_total as number) ?? 0,
        tax_total: (rawCart.tax_total as number) ?? 0,
        total: (rawCart.total as number) ?? 0,
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      });
    },
    [],
  );

  const getOrCreateCart = useCallback(async () => {
    const savedId =
      typeof window !== "undefined"
        ? localStorage.getItem(CART_ID_KEY)
        : null;

    if (savedId) {
      try {
        const existing = await cartApi.getCart(savedId);
        updateCartState(existing as unknown as Record<string, unknown>);
        return;
      } catch {
        localStorage.removeItem(CART_ID_KEY);
      }
    }

    const newCart = await cartApi.createCart();
    localStorage.setItem(CART_ID_KEY, (newCart as unknown as Record<string, unknown>).id as string);
    updateCartState(newCart as unknown as Record<string, unknown>);
  }, [updateCartState]);

  useEffect(() => {
    getOrCreateCart();
  }, [getOrCreateCart]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      if (!cart.id) return;
      setIsLoading(true);
      try {
        const updated = await cartApi.addLineItem(cart.id, variantId, quantity);
        updateCartState(updated as unknown as Record<string, unknown>);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    [cart.id, updateCartState],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      if (!cart.id) return;
      setIsLoading(true);
      try {
        const updated = await cartApi.updateLineItem(
          cart.id,
          lineItemId,
          quantity,
        );
        updateCartState(updated as unknown as Record<string, unknown>);
      } finally {
        setIsLoading(false);
      }
    },
    [cart.id, updateCartState],
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      if (!cart.id) return;
      setIsLoading(true);
      try {
        await cartApi.removeLineItem(cart.id, lineItemId);
        await getOrCreateCart();
      } finally {
        setIsLoading(false);
      }
    },
    [cart.id, getOrCreateCart],
  );

  const refreshCart = useCallback(async () => {
    await getOrCreateCart();
  }, [getOrCreateCart]);

  const applyDiscount = useCallback(
    async (code: string) => {
      if (!cart.id) return;
      setIsLoading(true);
      try {
        const updated = await cartApi.applyPromotionCode(cart.id, code);
        updateCartState(updated as unknown as Record<string, unknown>);
      } finally {
        setIsLoading(false);
      }
    },
    [cart.id, updateCartState],
  );

  const value = useMemo(
    () => ({
      ...cart,
      isLoading,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      updateItem,
      removeItem,
      refreshCart,
      applyDiscount,
    }),
    [cart, isLoading, isOpen, addItem, updateItem, removeItem, refreshCart, applyDiscount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return context;
}
