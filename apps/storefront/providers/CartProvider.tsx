"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  metadata?: Record<string, string>;
}

interface CartState {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  itemCount: number;
  /** Metadata koszyka (Medusa), m.in. express_delivery */
  metadata: Record<string, string>;
}

interface CartContextType extends CartState {
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number, metadata?: Record<string, string>) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  /** true, gdy w metadata jest express_delivery = true / "true" */
  expressDelivery: boolean;
  setExpressDelivery: (enabled: boolean) => Promise<void>;
  /** Dopłata ekspress: 50% sumy produktów (subtotal), w groszach */
  expressSurcharge: number;
  /** total z Medusy + expressSurcharge (gdy ekspress włączony) */
  grandTotal: number;
}

const CART_ID_KEY = "lumine_cart_id";

const CartContext = createContext<CartContextType | null>(null);

/** Kwota w groszach z odpowiedzi Medusy (czasem brak `total` na pozycji). */
function minorFromUnknown(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function lineItemTotalMinor(item: Record<string, unknown>): number {
  for (const key of ["total", "subtotal"]) {
    const m = minorFromUnknown(item[key]);
    if (m !== undefined && m >= 0) return m;
  }
  const unit = minorFromUnknown(item.unit_price);
  const qty = minorFromUnknown(item.quantity) ?? 1;
  if (unit !== undefined && unit >= 0 && qty > 0) {
    return Math.round(unit * qty);
  }
  return 0;
}

function mapCartItems(items: Array<Record<string, unknown>>): CartItem[] {
  return items.map((item) => ({
    id: item.id as string,
    variant_id: item.variant_id as string,
    title: item.title as string,
    thumbnail: item.thumbnail as string | undefined,
    quantity: Math.max(1, Math.round(minorFromUnknown(item.quantity) ?? 1)),
    unit_price: minorFromUnknown(item.unit_price) ?? 0,
    total: lineItemTotalMinor(item),
    metadata: item.metadata as Record<string, string> | undefined,
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
    metadata: {},
  });

  const normalizeCartMetadata = (raw: unknown): Record<string, string> => {
    if (!raw || typeof raw !== "object") return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      out[k] = typeof v === "string" ? v : String(v);
    }
    return out;
  };

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
        metadata: normalizeCartMetadata(rawCart.metadata),
      });
    },
    [],
  );

  const getOrCreateCart = useCallback(async () => {
    try {
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
      localStorage.setItem(
        CART_ID_KEY,
        (newCart as unknown as Record<string, unknown>).id as string,
      );
      updateCartState(newCart as unknown as Record<string, unknown>);
    } catch (e) {
      console.error(
        "[cart] Medusa niedostępna (np. 502) — koszyk nie został utworzony. Sprawdź backend i /api/medusa.",
        e,
      );
    }
  }, [updateCartState]);

  useEffect(() => {
    getOrCreateCart().then(() => {
      try {
        const saved = localStorage.getItem("lumine_express");
        if (saved === "true") {
          setCart((c) => {
            if (c.metadata.express_delivery === "true") return c;
            return { ...c, metadata: { ...c.metadata, express_delivery: "true" } };
          });
        }
      } catch { /* SSR / prywatny tryb */ }
    });
  }, [getOrCreateCart]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1, metadata?: Record<string, string>) => {
      if (!cart.id) return;
      setIsLoading(true);
      try {
        const updated = await cartApi.addLineItem(cart.id, variantId, quantity, metadata);
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

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  /** Ostatnie zapisane żądanie ekspress — ignorujemy przestarzałe odpowiedzi API. */
  const expressSaveSeq = useRef(0);

  const setExpressDelivery = useCallback(
    async (enabled: boolean) => {
      if (!cart.id) return;

      const seq = ++expressSaveSeq.current;
      const value = enabled ? "true" : "false";

      setCart((c) => ({
        ...c,
        metadata: { ...c.metadata, express_delivery: value },
      }));

      try {
        localStorage.setItem("lumine_express", value);
      } catch { /* SSR / prywatny tryb */ }

      const updated = await cartApi.updateCartMetadata(cart.id, {
        express_delivery: value,
      });
      if (seq !== expressSaveSeq.current) return;
      if (updated) {
        updateCartState(updated as unknown as Record<string, unknown>);
      }
    },
    [cart.id, updateCartState],
  );

  const value = useMemo(() => {
    const ed = cart.metadata.express_delivery;
    const expressDelivery = ed === "true" || ed === "1";
    const expressSurcharge = expressDelivery
      ? Math.round(cart.subtotal * 0.5)
      : 0;
    const grandTotal = cart.total + expressSurcharge;
    return {
      ...cart,
      isLoading,
      isOpen,
      openCart,
      closeCart,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
      applyDiscount,
      expressDelivery,
      setExpressDelivery,
      expressSurcharge,
      grandTotal,
    };
  }, [
    cart,
    isLoading,
    isOpen,
    openCart,
    closeCart,
    addItem,
    updateItem,
    removeItem,
    refreshCart,
    applyDiscount,
    setExpressDelivery,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return context;
}
