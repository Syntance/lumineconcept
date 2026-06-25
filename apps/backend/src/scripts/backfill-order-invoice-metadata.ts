import type { ExecArgs } from "@medusajs/framework/types";
import { backfillOrderInvoiceMetadata } from "../lib/backfill-order-invoice-metadata";

/**
 * CLI: `pnpm --filter @lumine/backend backfill-invoice-metadata`
 *
 * Kopiuje nazwę firmy z billing_address.company → order.metadata.companyName
 * i ustawia metadata.invoice = "tak" dla starych zamówień z fakturą.
 *
 * Flagi (po `--`):
 *   --dry-run   tylko raport, bez zapisu
 *   --limit=N   max zamówień (domyślnie 10000)
 */
export default async function run({ container, args }: ExecArgs) {
  const logger = container.resolve("logger") as {
    info: (msg: string) => void;
    warn: (msg: string) => void;
  };

  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  logger.info(`[backfill-invoice] start dryRun=${dryRun} limit=${limit ?? "10000"}`);

  const stats = await backfillOrderInvoiceMetadata(container, {
    dryRun,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  logger.info(
    `[backfill-invoice] done total=${stats.total} patched=${stats.patched} ` +
      `skipped=${stats.skipped} failed=${stats.failed}`,
  );

  for (const sample of stats.samples) {
    logger.info(
      `[backfill-invoice] #${sample.displayId ?? "—"} patch=${JSON.stringify(sample.patch)}`,
    );
  }

  if (dryRun) {
    logger.warn(
      "[backfill-invoice] dry-run — uruchom ponownie bez --dry-run aby zapisać.",
    );
  }

  if (stats.failed > 0) {
    process.exitCode = 1;
  }
}
