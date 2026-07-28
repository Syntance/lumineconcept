import { beforeEach, describe, expect, it } from "vitest";
import {
  CHECKOUT_FUNNEL_ONCE_STORAGE_KEY,
  hasFiredForCart,
  markFiredForCart,
} from "@/lib/analytics/checkout-analytics-context";

/**
 * Lejek liczył więcej `begin_checkout` niż `add_to_cart`, bo event odpalał się
 * ponownie po każdym odświeżeniu /checkout. Dedup musi przeżyć refresh
 * (sessionStorage), ale NIE może blokować kolejnego, nowego koszyka.
 */
describe("checkout funnel dedup", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("blokuje powtórkę dla tego samego koszyka", () => {
    expect(hasFiredForCart("begin_checkout", "cart_1")).toBe(false);
    markFiredForCart("begin_checkout", "cart_1");
    expect(hasFiredForCart("begin_checkout", "cart_1")).toBe(true);
  });

  it("przepuszcza nowy koszyk", () => {
    markFiredForCart("begin_checkout", "cart_1");
    expect(hasFiredForCart("begin_checkout", "cart_2")).toBe(false);
  });

  it("trzyma osobny stan per event", () => {
    markFiredForCart("begin_checkout", "cart_1");
    expect(hasFiredForCart("checkout_abandon", "cart_1")).toBe(false);
    markFiredForCart("checkout_abandon", "cart_1");
    expect(hasFiredForCart("begin_checkout", "cart_1")).toBe(true);
    expect(hasFiredForCart("checkout_abandon", "cart_1")).toBe(true);
  });

  it("nie wybucha na uszkodzonym wpisie w storage", () => {
    sessionStorage.setItem(CHECKOUT_FUNNEL_ONCE_STORAGE_KEY, "{niepoprawny");
    expect(hasFiredForCart("begin_checkout", "cart_1")).toBe(false);
  });

  it("ignoruje pusty cart_id", () => {
    markFiredForCart("begin_checkout", "");
    expect(hasFiredForCart("begin_checkout", "")).toBe(false);
  });
});
