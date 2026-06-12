import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Ustawia sekwencję `order.display_id` tak, że następne zamówienie dostanie numer 1.
 * Uruchamiaj po wyczyszczeniu / archiwizacji testowych zamówień.
 */
export async function resetOrderDisplayIdSequence(
  container: MedusaContainer,
): Promise<{ ok: boolean; nextDisplayId: number }> {
  const logger = container.resolve("logger") as { info: (m: string) => void };
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
    raw: (sql: string) => Promise<{ rows?: Array<Record<string, unknown>> }>;
  };

  const countRes = await knex.raw(
    `SELECT COUNT(1)::int AS c FROM "order" WHERE deleted_at IS NULL`,
  );
  const remaining = Number(countRes.rows?.[0]?.c ?? 0);

  // false → następny nextval() zwróci dokładnie 1
  const seqRes = await knex.raw(
    `SELECT setval(pg_get_serial_sequence('"order"', 'display_id'), 1, false) AS next_val`,
  );
  const nextDisplayId = Number(seqRes.rows?.[0]?.next_val ?? 1);

  logger.info(
    `[reset-order-sequence] pozostało ${remaining} zamówień w bazie; następny display_id = ${nextDisplayId}`,
  );

  return { ok: true, nextDisplayId };
}
