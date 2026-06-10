import { describe, expect, it } from "vitest";
import {
  bankTransferEmailLines,
  formatIbanDisplay,
  buildTransferTitle,
} from "../src/lib/bank-transfer";
import { renderBankTransferPendingEmail } from "../src/lib/email-templates";

describe("bank-transfer", () => {
  it("formatuje IBAN do wyświetlenia", () => {
    expect(formatIbanDisplay("PL58105011001000009085809698")).toBe(
      "PL58 1050 1100 1000 0090 8580 9698",
    );
  });

  it("buduje tytuł przelewu", () => {
    expect(buildTransferTitle(1042)).toBe("Zamówienie #1042");
  });

  it("zwraca linie do maila", () => {
    const lines = bankTransferEmailLines(99);
    expect(lines.recipientName).toBe("Lumine Concept");
    expect(lines.swift).toBe("INGBPLPW");
    expect(lines.transferTitle).toBe("Zamówienie #99");
  });
});

describe("renderBankTransferPendingEmail", () => {
  it("generuje subject i treść z danymi przelewu", () => {
    const { subject, html, text } = renderBankTransferPendingEmail({
      orderId: "order_test",
      displayId: 42,
      email: "test@example.com",
      currencyCode: "PLN",
      items: [{ title: "Produkt", quantity: 1, unitPriceMinor: 10000 }],
      subtotalMinor: 10000,
      shippingMinor: 2499,
      totalMinor: 12499,
    });
    expect(subject).toContain("#42");
    expect(html).toContain("INGBPLPW");
    expect(text).toContain("Zamówienie #42");
    expect(text).toContain("124,99");
  });
});
