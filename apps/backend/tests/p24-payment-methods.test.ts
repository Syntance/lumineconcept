import { describe, expect, it } from "vitest";
import {
  formatP24PaymentLabel,
  readP24MethodIdFromSessionData,
  readP24MethodNameFromSessionData,
} from "../src/lib/p24-payment-methods";

describe("formatP24PaymentLabel", () => {
  it("składa etykietę z nazwą metody", () => {
    expect(formatP24PaymentLabel("BLIK")).toBe("Przelewy24 (BLIK)");
    expect(formatP24PaymentLabel("mTransfer")).toBe("Przelewy24 (mTransfer)");
  });

  it("fallback bez nazwy", () => {
    expect(formatP24PaymentLabel("")).toBe("Przelewy24");
    expect(formatP24PaymentLabel("   ")).toBe("Przelewy24");
  });
});

describe("readP24MethodFromSessionData", () => {
  it("czyta p24_method_id i p24_method_name", () => {
    expect(
      readP24MethodIdFromSessionData({ p24_method_id: 181 }),
    ).toBe(181);
    expect(
      readP24MethodNameFromSessionData({ p24_method_name: "BLIK" }),
    ).toBe("BLIK");
  });

  it("ignoruje niepoprawne wartości", () => {
    expect(readP24MethodIdFromSessionData({ p24_method_id: 0 })).toBeNull();
    expect(readP24MethodNameFromSessionData({ p24_method_name: "  " })).toBeNull();
  });
});
