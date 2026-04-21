/**
 * Unit testy czystych funkcji i logiki retry z `lib/medusa/checkout.ts`.
 * Mockujemy całego Medusa SDK clienta — testujemy warstwę wrappera.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Medusa JS SDK — musimy mockować moduł, z którego importuje checkout.ts.
// `vi.hoisted` daje nam referencję przed `vi.mock` (który jest hoisted na górę).
const complete = vi.hoisted(() => vi.fn());
const retrieve = vi.hoisted(() => vi.fn());
const initiatePaymentSession = vi.hoisted(() => vi.fn());
const listPaymentProviders = vi.hoisted(() => vi.fn());

vi.mock("@/lib/medusa/client", () => ({
  medusa: {
    store: {
      cart: { complete, retrieve },
      payment: { initiatePaymentSession, listPaymentProviders },
    },
  },
}));

import {
  isCartAlreadyCompletedError,
  describeMedusaError,
  completeCart,
  listPaymentProviders as listProviders,
} from "@/lib/medusa/checkout";

describe("isCartAlreadyCompletedError", () => {
  it("wykrywa klasyczny komunikat Medusy v2", () => {
    expect(
      isCartAlreadyCompletedError({ message: "Cart is already completed" }),
    ).toBe(true);
  });

  it("jest case-insensitive", () => {
    expect(
      isCartAlreadyCompletedError({ message: "CART HAS already COMPLETED status" }),
    ).toBe(true);
  });

  it("akceptuje zwykły string", () => {
    expect(isCartAlreadyCompletedError("Already completed cart")).toBe(true);
  });

  it("zwraca false dla innych błędów", () => {
    expect(isCartAlreadyCompletedError({ message: "Network timeout" })).toBe(false);
    expect(isCartAlreadyCompletedError(null)).toBe(false);
    expect(isCartAlreadyCompletedError(undefined)).toBe(false);
  });
});

describe("describeMedusaError", () => {
  it("zwraca fallback dla pustego błędu", () => {
    expect(describeMedusaError(null, "fallback")).toBe("fallback");
    expect(describeMedusaError(undefined, "fallback")).toBe("fallback");
  });

  it("wyciąga message z obiektu błędu", () => {
    expect(
      describeMedusaError({ message: "Invalid shipping option" }, "fallback"),
    ).toBe("Invalid shipping option");
  });

  it("wyciąga message z zagnieżdżonego error.message", () => {
    expect(
      describeMedusaError({ error: { message: "DB down" } }, "fallback"),
    ).toBe("DB down");
  });

  it("tłumaczy 'already completed' na user-friendly PL", () => {
    expect(
      describeMedusaError({ message: "Cart is already completed" }, "fallback"),
    ).toBe("Koszyk został już sfinalizowany. Zacznij od nowa.");
  });

  it("używa type/code gdy brak message", () => {
    expect(
      describeMedusaError({ type: "validation_error", code: "E_42" }, "fallback"),
    ).toBe("validation_error (E_42)");
  });
});

describe("completeCart retry logic", () => {
  beforeEach(() => {
    complete.mockReset();
  });

  it("zwraca wynik natychmiast przy sukcesie za pierwszym razem", async () => {
    complete.mockResolvedValueOnce({
      type: "order",
      order: { id: "order_1", display_id: 1001 },
    });

    const result = await completeCart("cart_1");
    expect(result).toEqual({
      type: "order",
      order: { id: "order_1", display_id: 1001 },
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("ponawia przy 409/conflict aż do sukcesu", async () => {
    complete
      .mockRejectedValueOnce(Object.assign(new Error("conflict"), { status: 409 }))
      .mockRejectedValueOnce(Object.assign(new Error("idempotency conflict"), { status: 409 }))
      .mockResolvedValueOnce({ type: "order", order: { id: "order_2" } });

    const result = await completeCart("cart_2", { retries: 3, delayMs: 1 });
    expect(result.type).toBe("order");
    expect(complete).toHaveBeenCalledTimes(3);
  });

  it("NIE ponawia przy 'already completed' — od razu rzuca", async () => {
    complete.mockRejectedValue(
      Object.assign(new Error("Cart is already completed"), { status: 409 }),
    );

    await expect(completeCart("cart_3", { retries: 3, delayMs: 1 })).rejects.toThrow(
      /already completed/i,
    );
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("rzuca błąd po wyczerpaniu prób", async () => {
    complete.mockRejectedValue(
      Object.assign(new Error("conflict"), { status: 409 }),
    );

    await expect(completeCart("cart_4", { retries: 2, delayMs: 1 })).rejects.toThrow(
      /conflict/,
    );
    expect(complete).toHaveBeenCalledTimes(3);
  });

  it("NIE ponawia przy błędzie innym niż konflikt (np. 500)", async () => {
    complete.mockRejectedValue(
      Object.assign(new Error("Internal Server Error"), { status: 500 }),
    );

    await expect(completeCart("cart_5", { retries: 3, delayMs: 1 })).rejects.toThrow(
      /Internal Server Error/,
    );
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("zwraca result typu 'cart' z błędem bez rzucania wyjątku", async () => {
    complete.mockResolvedValueOnce({
      type: "cart",
      cart: { id: "cart_6" },
      error: { message: "Payment authorization failed", code: "E_AUTH" },
    });

    const result = await completeCart("cart_6");
    expect(result.type).toBe("cart");
    if (result.type === "cart") {
      expect(result.error?.message).toBe("Payment authorization failed");
    }
  });
});

describe("listPaymentProviders", () => {
  beforeEach(() => {
    listPaymentProviders.mockReset();
  });

  it("filtruje providerów z is_enabled === false", async () => {
    listPaymentProviders.mockResolvedValueOnce({
      payment_providers: [
        { id: "pp_system_default", is_enabled: true },
        { id: "pp_stripe", is_enabled: false },
        { id: "pp_p24" }, // brak is_enabled = traktujemy jak enabled
      ],
    });

    const result = await listProviders("reg_pl");
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id)).toEqual(["pp_system_default", "pp_p24"]);
  });

  it("zwraca pustą listę gdy backend nie zwrócił providerów", async () => {
    listPaymentProviders.mockResolvedValueOnce({ payment_providers: [] });
    const result = await listProviders("reg_pl");
    expect(result).toEqual([]);
  });
});
