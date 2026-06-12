import type { ExecArgs } from "@medusajs/framework/types";
import { wipeAllOrders } from "../lib/wipe-all-orders";

/** CLI: `medusa exec ./src/scripts/wipe-orders.ts` (na Railway / z Redis) */
export default async function run({ container }: ExecArgs) {
  const logger = container.resolve("logger") as { info: (m: string) => void };
  logger.info("[wipe-orders] start…");
  const result = await wipeAllOrders(container);
  logger.info(`[wipe-orders] usunięto ${result.deleted}, błędy: ${result.errors.length}`);
  if (result.errors.length) {
    for (const e of result.errors) logger.info(`  ✗ ${e}`);
    process.exitCode = 1;
  }
}
