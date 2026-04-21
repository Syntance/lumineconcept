import type { ExecArgs } from "@medusajs/framework/types";
import { ensureLuminePayment } from "../lib/ensure-lumine-payment";

/**
 * CLI: `pnpm --filter @lumine/backend setup-payment`
 *
 * Idempotentnie podpina systemowego (manual) payment-providera do regionów.
 */
export default async function run({ container }: ExecArgs) {
  const result = await ensureLuminePayment(container);
  for (const msg of result.messages) {
    console.log(`[setup-payment] ${msg}`);
  }
  console.log(
    `[setup-payment] ok=${result.ok} updated=${result.updated_region_ids.length}`,
  );
  if (!result.ok) {
    process.exitCode = 1;
  }
}
