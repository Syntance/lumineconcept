import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/** Hard delete wszystkich zamówień — tylko dla środowiska testowego / maintenance. */
export async function wipeAllOrders(container: MedusaContainer): Promise<{
  ok: boolean;
  deleted: number;
  errors: string[];
}> {
  const logger = container.resolve("logger") as {
    info: (m: string) => void;
    error: (m: string) => void;
  };
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
    raw: (sql: string, bindings?: unknown[]) => Promise<{ rows?: Array<Record<string, unknown>> }>;
  };

  const countRes = await knex.raw(`SELECT COUNT(id)::int AS c FROM "order"`);
  const totalInDb = Number(countRes.rows?.[0]?.c ?? 0);
  logger.info(`[wipe-orders] w bazie (raw SQL): ${totalInDb} zamówień`);

  const idsRes = await knex.raw(`SELECT id, display_id FROM "order" ORDER BY created_at ASC LIMIT 10000`);
  const rows = (idsRes.rows ?? []) as Array<{ id: string; display_id?: number | null }>;

  if (rows.length === 0) {
    return { ok: true, deleted: 0, errors: [] };
  }

  const errors: string[] = [];
  let deleted = 0;

  for (const order of rows) {
    try {
      const run = (sql: string, bindings?: unknown[]) => knex.raw(sql, bindings ?? []);
      await run(`DELETE FROM fulfillment_item WHERE fulfillment_id IN (SELECT id FROM fulfillment WHERE order_id = ?)`, [order.id]);
      await run(`DELETE FROM fulfillment WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_change_action WHERE order_change_id IN (SELECT id FROM order_change WHERE order_id = ?)`, [order.id]);
      await run(`DELETE FROM order_change WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_line_item_adjustment WHERE item_id IN (SELECT id FROM order_line_item WHERE order_id = ?)`, [order.id]);
      await run(`DELETE FROM order_line_item_tax_line WHERE item_id IN (SELECT id FROM order_line_item WHERE order_id = ?)`, [order.id]);
      await run(`DELETE FROM order_item WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_line_item WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_shipping_method_adjustment WHERE shipping_method_id IN (SELECT id FROM order_shipping_method WHERE order_id = ?)`, [order.id]);
      await run(`DELETE FROM order_shipping_method_tax_line WHERE shipping_method_id IN (SELECT id FROM order_shipping_method WHERE order_id = ?)`, [order.id]);
      await run(`DELETE FROM order_shipping_method WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_shipping WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_summary WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_transaction WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_address WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_cart WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_payment_collection WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_fulfillment WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_promotion WHERE order_id = ?`, [order.id]);
      await run(`DELETE FROM order_credit_line WHERE order_id = ?`, [order.id]);
      await run(
        `DELETE FROM payment WHERE payment_collection_id IN (SELECT payment_collection_id FROM order_payment_collection WHERE order_id = ?)`,
        [order.id],
      );
      await run(
        `DELETE FROM payment_session WHERE payment_collection_id IN (SELECT payment_collection_id FROM order_payment_collection WHERE order_id = ?)`,
        [order.id],
      );
      await run(`DELETE FROM "order" WHERE id = ?`, [order.id]);
      deleted += 1;
      logger.info(`[wipe-orders] usunięto #${order.display_id ?? "—"} ${order.id}`);
    } catch (e) {
      const msg = `${order.id}: ${(e as Error)?.message ?? e}`;
      errors.push(msg);
      logger.error(`[wipe-orders] błąd ${msg}`);
    }
  }

  return { ok: errors.length === 0, deleted, errors };
}
