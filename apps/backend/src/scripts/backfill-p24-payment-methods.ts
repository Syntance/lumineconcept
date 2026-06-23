import type { ExecArgs } from "@medusajs/framework/types";
import { backfillAllP24PaymentDetails } from "../lib/order-p24-metadata";

/**
 * CLI: `pnpm --filter @lumine/backend backfill-p24-methods`
 *
 * Uzupełnia metadata zamówień P24 o szczegółową metodę (BLIK, bank, karta…).
 * Idempotentny — pomija zamówienia, które już mają etykietę z nawiasem.
 *
 * Flagi (po `--`):
 *   --force   nadpisz istniejące etykiety
 *   --limit=N max zamówień (domyślnie 10000)
 */
export default async function run({ container, args }: ExecArgs) {
  const logger = container.resolve("logger") as {
    info: (msg: string) => void;
    warn: (msg: string) => void;
  };

  const force = args.includes("--force");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  logger.info(
    `[backfill-p24] start force=${force} limit=${limit ?? "10000"}`,
  );

  const stats = await backfillAllP24PaymentDetails(container, {
    force,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  logger.info(
    `[backfill-p24] done total=${stats.total} updated=${stats.updated} ` +
      `skipped=${stats.skipped} no_p24=${stats.noP24} no_method=${stats.noMethod} failed=${stats.failed}`,
  );

  if (stats.failed > 0) {
    process.exitCode = 1;
  }
}
