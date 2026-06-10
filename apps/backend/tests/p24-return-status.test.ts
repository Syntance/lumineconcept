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

  it("P24 status 1 → pending", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_x" },
        tx: { status: P24_STATUS_VERIFY, orderId: 1, amount: 100, currency: "PLN" },
        allowFailedOnZero: true,
      }),
    ).toBe("pending");
  });

  it("P24 status 0 bez grace → pending", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_x" },
        tx: { status: P24_STATUS_NO_PAYMENT, orderId: 0, amount: 0, currency: "PLN" },
        allowFailedOnZero: false,
      }),
    ).toBe("pending");
  });

  it("P24 status 0 po grace → failed", () => {
    expect(
      resolveP24ReturnOutcome({
        sessionData: { p24_session_id: "p24_x" },
        tx: { status: P24_STATUS_NO_PAYMENT, orderId: 0, amount: 0, currency: "PLN" },
        allowFailedOnZero: true,
      }),
    ).toBe("failed");
  });
});
