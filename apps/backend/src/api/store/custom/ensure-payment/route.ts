import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ensureLuminePayment } from "../../../../lib/ensure-lumine-payment";

/**
 * POST /store/custom/ensure-payment
 * Idempotentnie dokleja systemowego payment-providera do regionów (tryb
 * testowy bez zewnętrznej bramki). Wywołujemy z checkoutu, gdy
 * `listPaymentProviders({ region_id })` zwraca pustą listę.
 * Wyłącz: LUMINE_DISABLE_PUBLIC_ENSURE_PAYMENT=true
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (process.env.LUMINE_DISABLE_PUBLIC_ENSURE_PAYMENT === "true") {
    return res.status(403).json({
      message: "Publiczny bootstrap płatności jest wyłączony.",
    });
  }

  const result = await ensureLuminePayment(req.scope);

  // Tymczasowa diagnostyka P24 — usunąć po potwierdzeniu działania.
  let registeredProviders: string[] = [];
  try {
    const paymentModule = req.scope.resolve("payment") as {
      listPaymentProviders?: (
        sel?: Record<string, unknown>,
        cfg?: Record<string, unknown>,
      ) => Promise<Array<{ id: string }>>;
    };
    const list = (await paymentModule.listPaymentProviders?.({}, {})) ?? [];
    registeredProviders = list.map((p) => p.id);
  } catch (e) {
    registeredProviders = [`ERR: ${(e as Error).message}`];
  }

  const debug = {
    env_merchant: !!process.env.PRZELEWY24_MERCHANT_ID,
    env_apikey: !!process.env.PRZELEWY24_API_KEY,
    env_pos: process.env.PRZELEWY24_POS_ID ?? null,
    env_sandbox: process.env.PRZELEWY24_SANDBOX ?? null,
    registered_providers: registeredProviders,
  };

  const status = result.ok ? 200 : 422;
  return res.status(status).json({ ...result, debug });
}
