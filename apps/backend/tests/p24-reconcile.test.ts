import { describe, expect, it } from "vitest";
import {
  classifyCompleteCartError,
  isReconcilableSession,
  PRZELEWY24_PROVIDER_ID,
  RECONCILE_MIN_AGE_MS,
  RECONCILE_WINDOW_MS,
  uniqueCartIds,
} from "../src/lib/p24-reconcile";

const NOW = Date.parse("2026-06-10T12:00:00Z");

function sessionAgedMs(ageMs: number, overrides: Record<string, unknown> = {}) {
  return {
    id: "payses_1",
    provider_id: PRZELEWY24_PROVIDER_ID,
    status: "pending",
    created_at: new Date(NOW - ageMs).toISOString(),
    payment_collection_id: "paycol_1",
    ...overrides,
  };
}

describe("isReconcilableSession", () => {
  it("kwalifikuje wiszącą sesję P24 w oknie rekoncyliacji", () => {
    expect(isReconcilableSession(sessionAgedMs(60 * 60 * 1000), NOW)).toBe(true);
  });

  it("pomija świeże sesje (klient może właśnie płacić)", () => {
    expect(
      isReconcilableSession(sessionAgedMs(RECONCILE_MIN_AGE_MS - 1000), NOW),
    ).toBe(false);
  });

  it("kwalifikuje sesję dokładnie na granicy minimalnego wieku", () => {
    expect(
      isReconcilableSession(sessionAgedMs(RECONCILE_MIN_AGE_MS), NOW),
    ).toBe(true);
  });

  it("pomija sesje starsze niż okno (transakcja P24 wygasła)", () => {
    expect(
      isReconcilableSession(sessionAgedMs(RECONCILE_WINDOW_MS + 60_000), NOW),
    ).toBe(false);
  });

  it("pomija innych providerów (przelew tradycyjny pp_system_default)", () => {
    expect(
      isReconcilableSession(
        sessionAgedMs(60 * 60 * 1000, { provider_id: "pp_system_default" }),
        NOW,
      ),
    ).toBe(false);
  });

  it("pomija sesje już autoryzowane (obsłużyła je Medusa)", () => {
    expect(
      isReconcilableSession(
        sessionAgedMs(60 * 60 * 1000, { status: "authorized" }),
        NOW,
      ),
    ).toBe(false);
  });

  it("pomija sesje bez payment_collection_id", () => {
    expect(
      isReconcilableSession(
        sessionAgedMs(60 * 60 * 1000, { payment_collection_id: null }),
        NOW,
      ),
    ).toBe(false);
  });

  it("pomija sesje z uszkodzonym created_at", () => {
    expect(
      isReconcilableSession(
        sessionAgedMs(0, { created_at: "not-a-date" }),
        NOW,
      ),
    ).toBe(false);
    expect(
      isReconcilableSession(sessionAgedMs(0, { created_at: null }), NOW),
    ).toBe(false);
  });
});

describe("classifyCompleteCartError", () => {
  it("rozpoznaje nieopłaconą płatność po typie MedusaError", () => {
    expect(
      classifyCompleteCartError({
        type: "payment_authorization_error",
        message: "Payment authorization failed",
      }),
    ).toBe("payment_pending");
  });

  it("rozpoznaje nieopłaconą płatność po komunikacie", () => {
    expect(
      classifyCompleteCartError(new Error("Payment authorization failed")),
    ).toBe("payment_pending");
  });

  it("rozpoznaje requires_more jako oczekującą płatność", () => {
    expect(
      classifyCompleteCartError({
        type: "payment_requires_more_error",
        message: "More information is required for payment",
      }),
    ).toBe("payment_pending");
  });

  it("rozpoznaje wyścig — koszyk już domknięty przez storefront/webhook", () => {
    expect(
      classifyCompleteCartError(new Error("Cart is already completed.")),
    ).toBe("already_completed");
  });

  it("każdy inny błąd traktuje jako realny problem", () => {
    expect(classifyCompleteCartError(new Error("ECONNREFUSED"))).toBe("error");
    expect(classifyCompleteCartError(undefined)).toBe("error");
  });
});

describe("uniqueCartIds", () => {
  it("deduplikuje i odsiewa puste cart_id", () => {
    expect(
      uniqueCartIds([
        { cart_id: "cart_1" },
        { cart_id: "cart_1" },
        { cart_id: "  " },
        { cart_id: null },
        { cart_id: "cart_2" },
      ]),
    ).toEqual(["cart_1", "cart_2"]);
  });
});
