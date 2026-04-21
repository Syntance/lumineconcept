/**
 * Testy `CartProvider` skupione na zachowaniu krytycznym dla UX:
 *  - błąd `addItem` nie wycisza błędu (throw w górę, do toastów),
 *  - `removeItem` przy błędzie odświeżania nie gubi koszyka,
 *  - `setExpressDelivery` synchronizuje localStorage natychmiast,
 *  - anonim z `lumine_express` w localStorage → metadata push do Medusy
 *    po stworzeniu koszyka (lazy sync).
 *
 * Mockujemy cały `lib/medusa/cart` — testujemy logikę providera.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";

const getCart = vi.hoisted(() => vi.fn());
const createCart = vi.hoisted(() => vi.fn());
const addLineItem = vi.hoisted(() => vi.fn());
const updateLineItem = vi.hoisted(() => vi.fn());
const removeLineItem = vi.hoisted(() => vi.fn());
const applyPromotionCode = vi.hoisted(() => vi.fn());
const updateCartMetadata = vi.hoisted(() => vi.fn());

vi.mock("@/lib/medusa/cart", () => ({
  getCart,
  createCart,
  addLineItem,
  updateLineItem,
  removeLineItem,
  applyPromotionCode,
  updateCartMetadata,
}));

import { CartProvider, useCartContext } from "@/providers/CartProvider";

const EMPTY_CART = {
  id: "cart_new",
  items: [],
  subtotal: 0,
  total: 0,
  tax_total: 0,
  shipping_total: 0,
  metadata: {},
};

function SEEDED_CART(overrides: Record<string, unknown> = {}) {
  return {
    id: "cart_existing",
    items: [
      {
        id: "li_1",
        variant_id: "var_1",
        title: "Neon Lumine",
        quantity: 1,
        unit_price: 10000,
        total: 10000,
      },
    ],
    subtotal: 10000,
    total: 12300,
    tax_total: 2300,
    shipping_total: 0,
    metadata: {},
    ...overrides,
  };
}

/** Inspekcja kontekstu z testu, bez mountowania wielu komponentów. */
function CartInspector({
  onReady,
}: {
  onReady: (ctx: ReturnType<typeof useCartContext>) => void;
}) {
  const ctx = useCartContext();
  useEffect(() => {
    onReady(ctx);
  });
  return (
    <div>
      <span data-testid="cart-id">{ctx.id ?? "null"}</span>
      <span data-testid="item-count">{ctx.itemCount}</span>
      <span data-testid="express">{ctx.expressDelivery ? "1" : "0"}</span>
      <button
        type="button"
        data-testid="add"
        onClick={() =>
          void ctx.addItem("var_1", 1, undefined, false).catch(() => undefined)
        }
      >
        add
      </button>
      <button
        type="button"
        data-testid="remove"
        onClick={() => void ctx.removeItem("li_1").catch(() => undefined)}
      >
        remove
      </button>
      <button
        type="button"
        data-testid="toggle-express"
        onClick={() => void ctx.setExpressDelivery(true)}
      >
        express
      </button>
    </div>
  );
}

function renderProvider() {
  let latestCtx: ReturnType<typeof useCartContext> | null = null;
  const utils = render(
    <CartProvider>
      <CartInspector onReady={(c) => (latestCtx = c)} />
    </CartProvider>,
  );
  return { ...utils, getCtx: () => latestCtx! };
}

describe("CartProvider", () => {
  beforeEach(() => {
    getCart.mockReset();
    createCart.mockReset();
    addLineItem.mockReset();
    updateLineItem.mockReset();
    removeLineItem.mockReset();
    applyPromotionCode.mockReset();
    updateCartMetadata.mockReset();
    window.localStorage.clear();
  });

  it("tworzy nowy koszyk gdy brak zapisanego ID", async () => {
    createCart.mockResolvedValueOnce(EMPTY_CART);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_new");
    });
    expect(createCart).toHaveBeenCalledTimes(1);
    expect(getCart).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("lumine_cart_id")).toBe("cart_new");
  });

  it("pobiera istniejący koszyk po ID z localStorage", async () => {
    window.localStorage.setItem("lumine_cart_id", "cart_existing");
    getCart.mockResolvedValueOnce(SEEDED_CART());

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_existing");
    });
    expect(getCart).toHaveBeenCalledWith("cart_existing");
    expect(createCart).not.toHaveBeenCalled();
    expect(screen.getByTestId("item-count")).toHaveTextContent("1");
  });

  it("odrzuca sfinalizowany koszyk i tworzy nowy", async () => {
    window.localStorage.setItem("lumine_cart_id", "cart_old");
    getCart.mockResolvedValueOnce(
      SEEDED_CART({ id: "cart_old", completed_at: "2026-01-01T00:00:00Z" }),
    );
    createCart.mockResolvedValueOnce(EMPTY_CART);

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_new");
    });
    expect(createCart).toHaveBeenCalled();
    expect(window.localStorage.getItem("lumine_cart_id")).toBe("cart_new");
  });

  it("addItem: propaguje błąd w górę (toasty w UI mogą go złapać)", async () => {
    getCart.mockResolvedValueOnce(SEEDED_CART());
    window.localStorage.setItem("lumine_cart_id", "cart_existing");
    addLineItem.mockRejectedValueOnce(new Error("Variant not found"));

    const { getCtx } = renderProvider();
    await waitFor(() => expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_existing"));

    await expect(
      getCtx().addItem("var_missing", 1, undefined, false),
    ).rejects.toThrow("Variant not found");
  });

  it("removeItem: odświeża koszyk przez getCart, nie przez createCart", async () => {
    window.localStorage.setItem("lumine_cart_id", "cart_existing");
    getCart
      .mockResolvedValueOnce(SEEDED_CART())
      .mockResolvedValueOnce(SEEDED_CART({ items: [], subtotal: 0, total: 0 }));
    removeLineItem.mockResolvedValueOnce({});

    const { getCtx } = renderProvider();
    await waitFor(() => expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_existing"));

    await act(async () => {
      await getCtx().removeItem("li_1");
    });

    expect(removeLineItem).toHaveBeenCalledWith("cart_existing", "li_1");
    expect(getCart).toHaveBeenCalledTimes(2); // raz przy mount, raz przy refresh
    expect(createCart).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId("item-count")).toHaveTextContent("0"),
    );
  });

  it("removeItem: gdy refresh nie działa, lokalnie usuwa pozycję (nie gubi koszyka)", async () => {
    window.localStorage.setItem("lumine_cart_id", "cart_existing");
    getCart
      .mockResolvedValueOnce(SEEDED_CART())
      .mockRejectedValueOnce(new Error("502 Bad Gateway"));
    removeLineItem.mockResolvedValueOnce({});

    const { getCtx } = renderProvider();
    await waitFor(() => expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_existing"));

    await act(async () => {
      await getCtx().removeItem("li_1");
    });

    expect(createCart).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId("item-count")).toHaveTextContent("0"),
    );
    // ID koszyka zachowane — nie tworzymy nowego, gdy tylko refresh zawiódł.
    expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_existing");
  });

  it("setExpressDelivery: zapisuje localStorage natychmiast i PATCH-uje metadata", async () => {
    window.localStorage.setItem("lumine_cart_id", "cart_existing");
    getCart.mockResolvedValueOnce(SEEDED_CART());
    updateCartMetadata.mockResolvedValueOnce(
      SEEDED_CART({ metadata: { express_delivery: "true" } }),
    );

    const user = userEvent.setup();
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_existing"));

    await user.click(screen.getByTestId("toggle-express"));

    expect(window.localStorage.getItem("lumine_express")).toBe("true");
    await waitFor(() =>
      expect(updateCartMetadata).toHaveBeenCalledWith("cart_existing", {
        express_delivery: "true",
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("express")).toHaveTextContent("1"),
    );
  });

  it("lazy sync: lumine_express=true w localStorage → push do Medusy po mount", async () => {
    window.localStorage.setItem("lumine_express", "true");
    createCart.mockResolvedValueOnce(EMPTY_CART);
    updateCartMetadata.mockResolvedValueOnce(
      { ...EMPTY_CART, metadata: { express_delivery: "true" } },
    );

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("cart-id")).toHaveTextContent("cart_new"));
    await waitFor(() =>
      expect(updateCartMetadata).toHaveBeenCalledWith("cart_new", {
        express_delivery: "true",
      }),
    );
  });

  it("metadata z serwera nadpisuje lokalny stan (Medusa = autorytet)", async () => {
    window.localStorage.setItem("lumine_cart_id", "cart_existing");
    window.localStorage.setItem("lumine_express", "true");
    getCart.mockResolvedValueOnce(
      SEEDED_CART({ metadata: { express_delivery: "false" } }),
    );

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("express")).toHaveTextContent("0"),
    );
    // localStorage podciągnięty do wartości z serwera.
    await waitFor(() =>
      expect(window.localStorage.getItem("lumine_express")).toBe("false"),
    );
    // Nie pushujemy lokalnej wartości, skoro serwer zna stan.
    expect(updateCartMetadata).not.toHaveBeenCalled();
  });
});
