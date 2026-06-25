import { describe, expect, it } from "vitest";
import { buildInvoiceMetadataPatch } from "../src/lib/backfill-order-invoice-metadata";

describe("buildInvoiceMetadataPatch", () => {
  it("kopiuje firmę z billing_address gdy brak w metadata", () => {
    expect(
      buildInvoiceMetadataPatch({
        metadata: {},
        billingCompany: "Syntance Sp. z o.o.",
      }),
    ).toEqual({
      companyName: "Syntance Sp. z o.o.",
      invoice: "tak",
    });
  });

  it("nie nadpisuje istniejącej firmy w metadata", () => {
    expect(
      buildInvoiceMetadataPatch({
        metadata: { companyName: "Firma A", invoice: "tak" },
        billingCompany: "Firma B",
      }),
    ).toEqual({});
  });

  it("ustawia invoice gdy NIP już jest w metadata", () => {
    expect(
      buildInvoiceMetadataPatch({
        metadata: { nip: "5250000000" },
        billingCompany: "",
      }),
    ).toEqual({ invoice: "tak" });
  });

  it("pomija gdy brak danych faktury", () => {
    expect(
      buildInvoiceMetadataPatch({
        metadata: {},
        billingCompany: "",
      }),
    ).toEqual({});
  });
});
