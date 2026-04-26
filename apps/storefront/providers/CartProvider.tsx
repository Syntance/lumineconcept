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
import { cartLineConfigFingerprint } from "@/lib/cart/line-config-fingerprint";
import {
  invalidateShippingOptionsCache,
  normalizeShippingOptionsForDisplay,
  pickLowestPaidShippingOptionPrice,
  prefetchShippingOptions,
} from "@/lib/medusa/checkout";

interface CartItem {
  id: string;
  variant_id: string;
  title: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  total: number;
  metadata?: Record<string, string>;
  /**
   * Oznaczenie optymistycznie dodanej pozycji — widoczne w UI natychmiast po
   * kliknięciu „Dodaj do koszyka", zanim backend potwierdzi. Po sukcesie
   * podmieniamy ją na realny item z Medusy (po variant_id).
   */
  optimistic?: boolean;
}

interface CartState {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  shipping_total: number;
  /**
   * true gdy w koszyku jest już wybrana metoda dostawy (kurier lub odbiór).
   * Wymagane przy odbiorze osobistym: `shipping_total === 0`, ale nie doliczamy
   * szacunku kuriera do `grandTotal`.
   */
  hasShippingMethodSelection: boolean;
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
  addItem: (
    variantId: string,
    quantity?: number,
    metadata?: Record<string, string>,
    openDrawer?: boolean,
    /**
     * Dane do optymistycznego wyrenderowania pozycji w drawerze, zanim
     * backend odpowie. Jeśli przekazane — UI pokaże item natychmiast, bez
     * spinnera. Bez tego fallbackujemy do starego zachowania (await backend).
     */
    preview?: { title: string; thumbnail?: string; unit_price: number },
  ) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  /** true, gdy w metadata jest express_delivery = true / "true" */
  expressDelivery: boolean;
  setExpressDelivery: (enabled: boolean) => Promise<void>;
  /**
   * Dopłata ekspress: 50% sumy produktów (subtotal). Medusa v2 — kwota
   * w walucie głównej (PLN, dziesiętne).
   */
  expressSurcharge: number;
  /**
   * Suma `item.total` — do wiersza „Produkty” i ekspressu; pewniejsza niż
   * `cart.subtotal` z API (czasem zawiera dostawę po wyborze metody).
   */
  productsSubtotal: number;
  /** total z Medusy + expressSurcharge (gdy ekspress włączony) + szacunek dostawy, jeśli brak shipping_total */
  grandTotal: number;
  /**
   * Gdy `shipping_total` z Medusy jest 0 — najniższa kwota z `listCartOptions`
   * (spójnie z checkoutem). Po wyborze metody dostawy = null (używamy wyłącznie `shipping_total`).
   */
  shippingEstimate: number | null;
}

const CART_ID_KEY = "lumine_cart_id";

const CartContext = createContext<CartContextType | null>(null);

/**
 * Wyciąga liczbę (Medusa v2: dziesiętne PLN) z odpowiedzi — czasem przychodzi
 * jako string w BigNumberValue. Używane dla `total` / `subtotal` / `unit_price`
 * na pozycji koszyka.
 */
function numberFromUnknown(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  /* Medusa bywa zwraca BigNumberValue jako `{ value: "179.9", precision: 20 }` —
     szczególnie po niektórych ścieżkach API / proxy. Bez tego `(x as number)`
     daje `[object Object]` i psuje subtotal / express / porównanie z Adminem. */
  if (typeof v === "object" && v !== null && "value" in v) {
    return numberFromUnknown((v as { value: unknown }).value);
  }
  return undefined;
}

function lineItemTotal(item: Record<string, unknown>): number {
  for (const key of ["total", "subtotal"]) {
    const m = numberFromUnknown(item[key]);
    if (m !== undefined && m >= 0) return m;
  }
  const unit = numberFromUnknown(item.unit_price);
  const qty = numberFromUnknown(item.quantity) ?? 1;
  if (unit !== undefined && unit >= 0 && qty > 0) {
    // Zaokrąglamy do groszy (dwa miejsca), nie do pełnych złotych.
    return Math.round(unit * qty * 100) / 100;
  }
  return 0;
}

function mapCartItems(items: Array<Record<string, unknown>>): CartItem[] {
  return items.map((item) => ({
    id: item.id as string,
    variant_id: item.variant_id as string,
    title: item.title as string,
    thumbnail: item.thumbnail as string | undefined,
    quantity: Math.max(1, Math.round(numberFromUnknown(item.quantity) ?? 1)),
    unit_price: numberFromUnknown(item.unit_price) ?? 0,
    total: lineItemTotal(item),
    metadata: item.metadata as Record<string, string> | undefined,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState<number | null>(null);
  const [cart, setCart] = useState<CartState>({
    id: null,
    items: [],
    subtotal: 0,
    shipping_total: 0,
    hasShippingMethodSelection: false,
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
      const shippingMethods = rawCart.shipping_methods;
      const shippingT = numberFromUnknown(rawCart.shipping_total) ?? 0;
      const hasShippingMethodSelection =
        (Array.isArray(shippingMethods) && shippingMethods.length > 0) ||
        shippingT > 0;
      setCart({
        id: rawCart.id as string,
        items,
        subtotal: numberFromUnknown(rawCart.subtotal) ?? 0,
        shipping_total: shippingT,
        hasShippingMethodSelection,
        tax_total: numberFromUnknown(rawCart.tax_total) ?? 0,
        total: numberFromUnknown(rawCart.total) ?? 0,
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
          const existing = (await cartApi.getCart(savedId)) as unknown as
            Record<string, unknown>;
          /**
           * Jeśli zapisany koszyk został już sfinalizowany (np. klient wrócił
           * na stronę po zakupie albo w środku testu), Medusa zwraca go
           * normalnie, ale kolejne update'y wywalają się z „Cart is already
           * completed". Odrzucamy go i tworzymy świeży.
           */
          if (existing.completed_at) {
            localStorage.removeItem(CART_ID_KEY);
          } else {
            updateCartState(existing);
            return;
          }
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

  const itemsSignature = useMemo(
    () => cart.items.map((i) => `${i.variant_id}:${i.quantity}`).join(","),
    [cart.items],
  );

  useEffect(() => {
    if (!cart.id || cart.items.length === 0) {
      setShippingEstimate(null);
      return;
    }
    if (cart.hasShippingMethodSelection) {
      setShippingEstimate(null);
      return;
    }

    let cancelled = false;
    invalidateShippingOptionsCache(cart.id);
    void prefetchShippingOptions(cart.id)
      .then((raw) => {
        if (cancelled) return;
        const opts = normalizeShippingOptionsForDisplay(
          raw as unknown as Array<Record<string, unknown>>,
        );
        setShippingEstimate(pickLowestPaidShippingOptionPrice(opts));
      })
      .catch(() => {
        if (!cancelled) setShippingEstimate(null);
      });

    return () => {
      cancelled = true;
    };
  }, [cart.id, cart.hasShippingMethodSelection, itemsSignature]);

  useEffect(() => {
    /**
     * Autorytetem jest Medusa (`metadata.express_delivery` w koszyku).
     * `localStorage` to tylko fallback dla anonima, który kliknął „ekspres"
     * zanim jego koszyk powstał. Po stworzeniu koszyka:
     *   - jeśli Medusa zna wartość → synchronizujemy ją do localStorage,
     *   - jeśli Medusa nic nie ma, a localStorage ma „true" → leniwie
     *     wysyłamy metadata do Medusy (fire-and-forget, bez blokady UI).
     */
    getOrCreateCart().then(() => {
      setCart((c) => {
        const fromServer = c.metadata.express_delivery;
        if (fromServer !== undefined) {
          try {
            localStorage.setItem("lumine_express", fromServer);
          } catch { /* SSR / prywatny tryb */ }
          return c;
        }

        let fromLocal: string | null = null;
        try {
          fromLocal = localStorage.getItem("lumine_express");
        } catch { /* SSR / prywatny tryb */ }

        if (c.id && (fromLocal === "true" || fromLocal === "false")) {
          void cartApi
            .updateCartMetadata(c.id, { express_delivery: fromLocal })
            .catch(() => undefined);
          return {
            ...c,
            metadata: { ...c.metadata, express_delivery: fromLocal },
          };
        }
        return c;
      });
    });
  }, [getOrCreateCart]);

  const addItem = useCallback(
    async (
      variantId: string,
      quantity = 1,
      metadata?: Record<string, string>,
      openDrawer = true,
      preview?: { title: string; thumbnail?: string; unit_price: number },
    ) => {
      if (!cart.id) return;

      /**
       * Optymistyczny render: gdy mamy `preview`, natychmiast pokazujemy
       * pozycję w drawerze (0 ms percepcji), a request do backendu leci
       * w tle. Jeśli ten sam variant_id już jest w koszyku — tylko
       * podbijamy ilość w tymczasowym stanie. `optimistic: true` pozwala
       * UI pokazać lekki wskaźnik „zapisywanie…" dla świeżej linii.
       *
       * Po sukcesie backendu: `updateCartState` z prawdziwego response
       * nadpisuje całą listę i flagi znikają (nowa linia ma stałe `id`
       * z Medusy). Po błędzie: cofamy zmianę i rzucamy do wywołującego.
       */
      const optimisticId = `optimistic:${variantId}:${Date.now()}`;
      let didOptimisticRender = false;

      if (preview) {
        didOptimisticRender = true;
        setCart((c) => {
          const fp = cartLineConfigFingerprint(metadata);
          const existing = c.items.find(
            (i) =>
              i.variant_id === variantId &&
              cartLineConfigFingerprint(i.metadata) === fp,
          );
          let items: CartItem[];
          if (existing) {
            items = c.items.map((i) =>
              i.variant_id === variantId &&
              cartLineConfigFingerprint(i.metadata) === fp
                ? {
                    ...i,
                    quantity: i.quantity + quantity,
                    total:
                      Math.round(
                        (i.unit_price * (i.quantity + quantity)) * 100,
                      ) / 100,
                    optimistic: true,
                  }
                : i,
            );
          } else {
            items = [
              ...c.items,
              {
                id: optimisticId,
                variant_id: variantId,
                title: preview.title,
                thumbnail: preview.thumbnail,
                quantity,
                unit_price: preview.unit_price,
                total:
                  Math.round(preview.unit_price * quantity * 100) / 100,
                metadata,
                optimistic: true,
              },
            ];
          }
          const newSubtotal =
            Math.round(
              (c.subtotal + preview.unit_price * quantity) * 100,
            ) / 100;
          return {
            ...c,
            items,
            subtotal: newSubtotal,
            total:
              Math.round(
                (c.total + preview.unit_price * quantity) * 100,
              ) / 100,
            itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
          };
        });
        if (openDrawer) setIsOpen(true);
      }

      setIsLoading(true);
      try {
        try {
          const updated = await cartApi.addLineItem(
            cart.id,
            variantId,
            quantity,
            metadata,
          );
          updateCartState(updated as unknown as Record<string, unknown>);
          if (openDrawer && !didOptimisticRender) setIsOpen(true);
          return;
        } catch (e) {
          /**
           * Jeśli aktualny koszyk jest już sfinalizowany (Medusa zwraca 400
           * „Cart is already completed"), albo nie istnieje (404), tworzymy
           * świeży i powtarzamy add-to-cart. Bez tego user po nieudanej
           * finalizacji nie mógł dodać niczego nowego („Nie udało się dodać
           * produktu do koszyka") i utykał.
           */
          const msg = (e as { message?: string })?.message ?? "";
          const status =
            (e as { status?: number })?.status ??
            (e as { response?: { status?: number } })?.response?.status ??
            0;
          const isCompleted = /already\s+completed/i.test(msg);
          /** Tylko brak koszyka — nie „Variant not found” itp. */
          const isCartMissing =
            status === 404 ||
            (/\bcart\b/i.test(msg) && /not\s+found/i.test(msg));
          if (!isCompleted && !isCartMissing) throw e;

          try {
            localStorage.removeItem(CART_ID_KEY);
          } catch {
            /* prywatny tryb */
          }
          const fresh = (await cartApi.createCart()) as unknown as Record<
            string,
            unknown
          >;
          const freshId = fresh.id as string;
          try {
            localStorage.setItem(CART_ID_KEY, freshId);
          } catch {
            /* prywatny tryb */
          }
          const updated = await cartApi.addLineItem(
            freshId,
            variantId,
            quantity,
            metadata,
          );
          updateCartState(updated as unknown as Record<string, unknown>);
          if (openDrawer && !didOptimisticRender) setIsOpen(true);
        }
      } catch (e) {
        console.error("[cart] addItem", e);
        /**
         * Cofamy optymistyczną zmianę — skoro backend odrzucił, UI musi
         * wrócić do stanu sprzed kliknięcia, inaczej user zobaczy
         * „zombie" pozycję, której nie może usunąć (bo Medusa jej nie zna).
         */
        if (didOptimisticRender) {
          setCart((c) => {
            const items = c.items.filter((i) => i.id !== optimisticId);
            const subtotal = items.reduce((s, i) => s + i.total, 0);
            return {
              ...c,
              items,
              subtotal,
              total: subtotal,
              itemCount: items.reduce((s, i) => s + i.quantity, 0),
            };
          });
        }
        throw e;
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
      } catch (e) {
        console.error("[cart] updateItem", e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [cart.id, updateCartState],
  );

  /**
   * Bezpieczne usunięcie linii. Wcześniej po `removeLineItem` wołaliśmy
   * `getOrCreateCart()`, który przy timeoutzie Medusy tworzył NOWY koszyk
   * i klient tracił całą zawartość. Teraz: próbujemy odświeżyć koszyk
   * przez `getCart()` (bez tworzenia nowego); w razie błędu logujemy
   * i zachowujemy ostatni znany stan — użytkownik może spróbować
   * ponownie lub przeładować stronę.
   */
  const removeItem = useCallback(
    async (lineItemId: string) => {
      if (!cart.id) return;
      setIsLoading(true);
      try {
        await cartApi.removeLineItem(cart.id, lineItemId);
        try {
          const refreshed = await cartApi.getCart(cart.id);
          updateCartState(refreshed as unknown as Record<string, unknown>);
        } catch (refreshErr) {
          console.warn("[cart] removeItem: refresh nie powiódł się", refreshErr);
          setCart((c) => {
            const items = c.items.filter((i) => i.id !== lineItemId);
            const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
            return { ...c, items, itemCount };
          });
        }
      } catch (e) {
        console.error("[cart] removeItem", e);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [cart.id, updateCartState],
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
      const seq = ++expressSaveSeq.current;
      const value = enabled ? "true" : "false";

      setCart((c) => ({
        ...c,
        metadata: { ...c.metadata, express_delivery: value },
      }));

      try {
        localStorage.setItem("lumine_express", value);
      } catch { /* SSR / prywatny tryb */ }

      if (!cart.id) return;

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
    const productsSubtotal =
      Math.round(
        cart.items.reduce((s, i) => s + i.total, 0) * 100,
      ) / 100;
    // Dopłata ekspress to 50% sumy pozycji — zaokrąglamy do groszy (2 miejsc po
    // przecinku), nie do pełnych złotych.
    const expressSurcharge = expressDelivery
      ? Math.round(productsSubtotal * 0.5 * 100) / 100
      : 0;
    const shippingAddon = cart.hasShippingMethodSelection
      ? 0
      : (shippingEstimate ?? 0);
    const grandTotal = Math.round(
      (cart.total + expressSurcharge + shippingAddon) * 100,
    ) / 100;
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
      productsSubtotal,
      grandTotal,
      shippingEstimate,
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
    shippingEstimate,
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
