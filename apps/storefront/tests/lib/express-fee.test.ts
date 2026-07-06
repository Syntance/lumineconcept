import { describe, expect, it } from "vitest";
import {
  EXPRESS_FEE_SHIPPING_METHOD_NAME,
  expressFeeIncludedInCart,
} from "@/lib/checkout/express-fee";

describe("expressFeeIncludedInCart", () => {
  it("zwraca kwotę metody-dopłaty express z koszyka", () => {
    expect(
      expressFeeIncludedInCart([
        { name: "Kurier DPD", amount: 25 },
        { name: EXPRESS_FEE_SHIPPING_METHOD_NAME, amount: 49.95 },
      ]),
    ).toBe(49.95);
  });

  it("0 gdy brak metody-dopłaty / pusta lista / null", () => {
    expect(expressFeeIncludedInCart([{ name: "Kurier DPD", amount: 25 }])).toBe(0);
    expect(expressFeeIncludedInCart([])).toBe(0);
    expect(expressFeeIncludedInCart(null)).toBe(0);
    expect(expressFeeIncludedInCart(undefined)).toBe(0);
  });

  it("ignoruje metodę-dopłatę z zerową/nienumeryczną kwotą", () => {
    expect(
      expressFeeIncludedInCart([
        { name: EXPRESS_FEE_SHIPPING_METHOD_NAME, amount: 0 },
      ]),
    ).toBe(0);
    expect(
      expressFeeIncludedInCart([
        { name: EXPRESS_FEE_SHIPPING_METHOD_NAME, amount: "abc" },
      ]),
    ).toBe(0);
  });

  it("toleruje kwoty jako stringi", () => {
    expect(
      expressFeeIncludedInCart([
        { name: EXPRESS_FEE_SHIPPING_METHOD_NAME, amount: "49.95" },
      ]),
    ).toBe(49.95);
  });
});
