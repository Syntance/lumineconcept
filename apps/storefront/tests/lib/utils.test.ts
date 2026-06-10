import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/utils";

describe("formatPrice", () => {
  it("formatuje PLN bez spacji po przecinku (standard pl-PL)", () => {
    expect(formatPrice(99.9)).toBe("99,90\u00a0zł");
    expect(formatPrice(219.9)).toBe("219,90\u00a0zł");
  });

  it("grupuje tysiące niełamiącą spacją", () => {
    expect(formatPrice(1234.56)).toBe("1\u00a0234,56\u00a0zł");
  });

  it("obsługuje zero i ujemne kwoty", () => {
    expect(formatPrice(0)).toBe("0,00\u00a0zł");
    expect(formatPrice(-15.5)).toBe("-15,50\u00a0zł");
  });

  it("dla obcych walut deleguje do Intl (fallback)", () => {
    const formatted = formatPrice(10, "EUR", "de-DE");
    expect(formatted).toContain("10");
    expect(formatted).toMatch(/€|EUR/);
  });
});
