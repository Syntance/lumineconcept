import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { hasValidInternalSecret } from "../../../../lib/internal-auth";
import { Modules } from "@medusajs/framework/utils";

/**
 * POST /store/custom/reset-payment
 * Jednorazowe narzędzie serwisowe — resetuje kolekcję płatności do stanu not_paid.
 * Usuwa sesje pp_system_default (z mark-as-paid) i czyści refund.
 * Body: { collection_id, order_id }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!hasValidInternalSecret(req)) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const { collection_id } = req.body as { collection_id: string; order_id: string };
  if (!collection_id) {
    return res.status(400).json({ ok: false, error: "brak collection_id" });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentModule = req.scope.resolve(Modules.PAYMENT) as any;

  const [collection] = await paymentModule.listPaymentCollections(
    { id: [collection_id] },
    { relations: ["payments", "payment_sessions"] },
  );

  if (!collection) {
    return res.status(404).json({ ok: false, error: "kolekcja nie znaleziona" });
  }

  const log: string[] = [];
  log.push(`collection=${collection.id} status=${collection.status}`);

  // Usuń sesje pp_system_default (stworzone przez mark-as-paid)
  const systemSessions = (collection.payment_sessions ?? []).filter(
    (s: { provider_id: string }) => s.provider_id === "pp_system_default",
  );
  for (const s of systemSessions) {
    await paymentModule.deletePaymentSession(s.id);
    log.push(`deleted session ${s.id}`);
  }

  // Wyczyść raw pola kolekcji — bezpośrednia aktualizacja przez ORM
  await paymentModule.updatePaymentCollections(collection_id, {
    status: "not_paid",
    authorized_amount: null,
    captured_amount: null,
    refunded_amount: null,
    completed_at: null,
  });
  log.push("collection reset to not_paid");

  // Weryfikacja
  const [after] = await paymentModule.listPaymentCollections(
    { id: [collection_id] },
    { relations: ["payments", "payment_sessions"] },
  );

  return res.status(200).json({
    ok: true,
    log,
    after: {
      status: after?.status,
      payments: after?.payments?.length ?? 0,
      sessions: after?.payment_sessions?.map((s: { id: string; provider_id: string; status: string }) => ({
        id: s.id,
        provider: s.provider_id,
        status: s.status,
      })),
    },
  });
}
