import { MedusaError } from "@medusajs/framework/utils";
import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { auditLog } from "../../lib/checkout-audit";
import {
  evaluateCartCompletionGuard,
  type GuardCartSnapshot,
  type GuardSession,
} from "../../lib/complete-cart-guard";
import {
  fetchP24TransactionBySessionId,
  loadP24ApiConfig,
} from "../../lib/p24-transaction-api";

/**
 * Hook `validate` — wykonywany PRZED wszystkimi krokami `completeCartWorkflow`
 * (w tym przed `createOrdersStep`).
 *
 * Powód (incydent #10165): Medusa tworzy zamówienie przed autoryzacją
 * płatności i przy odmowie autoryzacji polega na kompensacji (usunięciu
 * zamówienia). Restart/deploy w trakcie kompensacji zostawia w bazie
 * zamówienie `not_paid` bez płatności. Ten hook rzuca
 * `payment_authorization_error` zanim cokolwiek powstanie — storefront
 * dostaje standardową odpowiedź `{ type: "cart", error }` (obsłużoną jak
 * przy zwykłej odmowie autoryzacji), a cron reconcile domyka koszyk, gdy
 * wpłata realnie pojawi się w P24.
 */

type HookCart = {
  id?: string;
  completed_at?: string | Date | null;
  total?: number | string | null;
  payment_collection?: {
    payment_sessions?: GuardSession[] | null;
  } | null;
};

type HookLogger = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
};

function bankTransferAllowed(): boolean {
  if (process.env.FEATURE_BANK_TRANSFER === "1") return true;
  // Środowiska bez skonfigurowanego P24 (dev/test/e2e) — pp_system_default
  // jest tam jedynym providerem i musi działać.
  return loadP24ApiConfig() === null;
}

completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const logger = container.resolve("logger") as HookLogger;
  const hookCart = (cart ?? {}) as HookCart;
  const cartId = hookCart.id ?? "?";

  const snapshot: GuardCartSnapshot = {
    completed_at: hookCart.completed_at ?? null,
    total: hookCart.total ?? null,
    payment_sessions: hookCart.payment_collection?.payment_sessions ?? [],
  };

  auditLog(logger, "info", "complete-cart-attempt", {
    cart_id: cartId,
    sessions: snapshot.payment_sessions.map(
      (s) => `${s.provider_id ?? "?"}:${s.status ?? "?"}`,
    ),
    completed_at: snapshot.completed_at ? "yes" : "no",
  });

  const p24Config = loadP24ApiConfig();
  const decision = await evaluateCartCompletionGuard(
    snapshot,
    async (p24SessionId) => {
      if (!p24Config) return null;
      const tx = await fetchP24TransactionBySessionId(p24SessionId, p24Config);
      auditLog(logger, "info", "p24-authorize-result", {
        cart_id: cartId,
        p24_session_id: p24SessionId,
        p24_status: tx ? tx.status : "not_found",
      });
      return tx ? { status: tx.status } : null;
    },
    { bankTransferAllowed: bankTransferAllowed() },
  );

  if (decision.allow) {
    auditLog(logger, "info", "complete-cart-allowed", {
      cart_id: cartId,
      reason: decision.reason,
    });
    return;
  }

  auditLog(logger, "warn", "complete-cart-blocked", {
    cart_id: cartId,
    reason: decision.reason,
  });
  throw new MedusaError(
    MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
    decision.message,
  );
});
