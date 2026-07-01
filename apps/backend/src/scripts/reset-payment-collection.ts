import type { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

/**
 * Resetuje kolekcję płatności z powrotem do stanu not_paid.
 * Usuwa błędnie utworzony system-payment i refund, zostawiając oryginalną sesję P24.
 *
 * Użycie: medusa exec ./src/scripts/reset-payment-collection.ts
 * Env:    COLLECTION_ID=pay_col_... ORDER_ID=order_...
 */
export default async function run({ container }: ExecArgs) {
  const logger = container.resolve("logger") as { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void };

  const collectionId = process.env.COLLECTION_ID;
  const orderId = process.env.ORDER_ID;

  if (!collectionId || !orderId) {
    throw new Error("Brak COLLECTION_ID lub ORDER_ID w env");
  }

  const paymentModule = container.resolve(Modules.PAYMENT);

  // Pobierz kolekcję z płatnościami i sesjami
  const [collection] = await paymentModule.listPaymentCollections(
    { id: [collectionId] },
    { relations: ["payments", "payments.captures", "payments.refunds", "payment_sessions"] },
  );

  if (!collection) throw new Error(`Kolekcja ${collectionId} nie znaleziona`);

  logger.info(`[reset] kolekcja ${collection.id} status=${collection.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments: any[] = collection.payments ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions: any[] = collection.payment_sessions ?? [];

  logger.info(`[reset] payments: ${JSON.stringify(payments.map((p: { id: string; provider_id: string; captured_at: unknown }) => ({ id: p.id, provider: p.provider_id, captured_at: p.captured_at })))}`);
  logger.info(`[reset] sessions: ${JSON.stringify(sessions.map((s: { id: string; provider_id: string; status: string }) => ({ id: s.id, provider: s.provider_id, status: s.status })))}`);

  // Usuń sesje system_default — zostawia oryginalną sesję P24
  const systemSessions = sessions.filter((s: { provider_id: string }) => s.provider_id === "pp_system_default");
  for (const session of systemSessions) {
    logger.info(`[reset] usuwam system session ${session.id}`);
    await paymentModule.deletePaymentSession(session.id);
  }

  // Zresetuj kolekcję na not_paid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (paymentModule as any).updatePaymentCollections(collectionId, {
    status: "not_paid",
    authorized_amount: null,
    captured_amount: null,
    refunded_amount: null,
    completed_at: null,
  });

  logger.info(`[reset] gotowe — kolekcja zresetowana do not_paid`);

  // Weryfikacja
  const [after] = await paymentModule.listPaymentCollections(
    { id: [collectionId] },
    { relations: ["payments", "payment_sessions"] },
  );
  logger.info(`[reset] po resecie: status=${after?.status} payments=${after?.payments?.length ?? 0} sessions=${after?.payment_sessions?.length ?? 0}`);
}
