import { describe, expect, it } from "vitest";
import {
  P24_STATUS_NO_PAYMENT,
  P24_STATUS_PAID,
  P24_STATUS_VERIFY,
  resolveP24ReturnOutcome,
} from "../src/lib/p24-transaction-api";

describe("resolveP24ReturnOutcome", () => {
  it("verified session → paid", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { status: "verified", p24_session_id: "p24_x" },
        tx: null,
        allowFailedOnZero: true,
      }),
    ).toBe("paid");
  });

  it("P24 status 2 → paid", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_x" },
        tx: { status: P24_STATUS_PAID, orderId: 1, amount: 100, currency: "PLN" },
        allowFailedOnZero: false,
      }),
    ).toBe("paid");
  });

  it("P24 status 1 → pending (płatność w trakcie weryfikacji)", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_x" },
        tx: { status: P24_STATUS_VERIFY, orderId: 1, amount: 100, currency: "PLN" },
        allowFailedOnZero: true,
      }),
    ).toBe("pending");
  });

  it("bez grace → pending (jeszcze weryfikujemy)", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_x" },
        tx: { status: P24_STATUS_NO_PAYMENT, orderId: 0, amount: 0, currency: "PLN" },
        allowFailedOnZero: false,
      }),
    ).toBe("pending");
  });

  it("status 0 po grace → failed", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_x" },
        tx: { status: P24_STATUS_NO_PAYMENT, orderId: 0, amount: 0, currency: "PLN" },
        allowFailedOnZero: true,
      }),
    ).toBe("failed");
  });

  it("brak transakcji w P24 po grace → failed (np. anulowana sesja retry)", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_new" },
        tx: null,
        allowFailedOnZero: true,
      }),
    ).toBe("failed");
  });
});
