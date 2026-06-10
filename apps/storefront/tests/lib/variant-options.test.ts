/**
 * Regresja: Medusa v2 zwraca `variant.options` jako tablicę
 * `{ value, option: { title } }`, a PDP dobiera wariant po słowniku.
 * Bez normalizacji produkt z nie-kolorową opcją (np. „Wariant")
 * miał na stałe disabled CTA „dodaj do koszyka".
 */
import { describe, expect, it } from "vitest";
import { variantOptionsRecord } from "@/lib/products/variant-options";

describe("variantOptionsRecord", () => {
  it("normalizuje tablicę z Medusy do słownika tytuł→wartość", () => {
    expect(
      variantOptionsRecord([
        { id: "optval_1", value: "Standard", option: { id: "opt_1", title: "Wariant" } },
        { id: "optval_2", value: "M", option: { id: "opt_2", title: "Rozmiar" } },
      ]),
    ).toEqual({ Wariant: "Standard", Rozmiar: "M" });
  });

  it("pomija wpisy bez option.title lub bez value", () => {
    expect(
      variantOptionsRecord([
        { value: "Standard", option: null },
        { value: undefined, option: { title: "Wariant" } },
        null,
      ]),
    ).toEqual({});
  });

  it("przepuszcza już znormalizowany Record (idempotentne)", () => {
    expect(variantOptionsRecord({ Wariant: "Standard" })).toEqual({
      Wariant: "Standard",
    });
  });

  it("zwraca pusty słownik dla null/undefined", () => {
    expect(variantOptionsRecord(null)).toEqual({});
    expect(variantOptionsRecord(undefined)).toEqual({});
  });
});
