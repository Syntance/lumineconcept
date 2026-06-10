/**
 * Testy danych do przelewu tradycyjnego — to, co klient widzi na stronie
 * potwierdzenia i w mailu. Błędny tytuł/IBAN = wpłaty nie do dopasowania.
 */
import { describe, expect, it } from "vitest";
import {
  buildTransferTitle,
  formatIbanDisplay,
  bankTransferMergeVars,
} from "@/lib/payment/bank-transfer";

describe("formatIbanDisplay", () => {
  it("grupuje IBAN po 4 znaki", () => {
    expect(formatIbanDisplay("PL58105011001000009085809698")).toBe(
      "PL58 1050 1100 1000 0090 8580 9698",
    );
  });

  it("normalizuje białe znaki i wielkość liter", () => {
    expect(formatIbanDisplay("pl61 1090 1014 0000 0712 1981 2874")).toBe(
      "PL61 1090 1014 0000 0712 1981 2874",
    );
  });

  it("pusty IBAN → myślnik (UI pokaże komunikat o konfiguracji)", () => {
    expect(formatIbanDisplay("")).toBe("—");
  });
});

describe("buildTransferTitle", () => {
  it("buduje tytuł z numerem zamówienia (display_id)", () => {
    expect(buildTransferTitle(1042)).toMatch(/#1042$/);
  });

  it("działa też ze stringiem", () => {
    expect(buildTransferTitle("1042")).toMatch(/#1042$/);
  });
});

describe("bankTransferMergeVars", () => {
  it("zwraca komplet zmiennych do maila bank_transfer_pending", () => {
    const vars = bankTransferMergeVars(77);
    expect(vars.odbiorca).toBeTruthy();
    expect(vars.tytulPrzelewu).toMatch(/#77$/);
    expect(vars.terminPlatnosci).toMatch(/dni roboczych/);
    expect(vars).toHaveProperty("nrKonta");
    expect(vars.swift).toBe("INGBPLPW");
    expect(vars.adresOdbiorcy).toContain("Ryczów");
  });
});
