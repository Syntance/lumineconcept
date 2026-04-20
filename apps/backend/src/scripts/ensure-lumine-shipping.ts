import type { SubscriberArgs } from "@medusajs/framework";
import { ensureLumineShipping } from "../lib/ensure-lumine-shipping";

/**
 * Idempotentny bootstrap: magazyn, strefa PL, opcja „Kurier DPD”.
 * Uruchom: pnpm --filter @lumine/backend setup-shipping
 */
export default async function runEnsureLumineShipping({
  container,
}: Pick<SubscriberArgs, "container">) {
  const result = await ensureLumineShipping(container);
  for (const m of result.messages) {
    console.log(`[ensure-lumine-shipping] ${m}`);
  }
  console.log(
    `[ensure-lumine-shipping] ok=${result.ok} skipped=${result.skipped ?? false} shipping_option_id=${result.shipping_option_id ?? ""}`,
  );
  if (!result.ok) {
    process.exitCode = 1;
  }
}
