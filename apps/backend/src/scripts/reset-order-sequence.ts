import type { ExecArgs } from "@medusajs/framework/types";
import { resetOrderDisplayIdSequence } from "../lib/reset-order-display-sequence";

/** CLI: `medusa exec ./src/scripts/reset-order-sequence.ts` */
export default async function run({ container }: ExecArgs) {
  const result = await resetOrderDisplayIdSequence(container);
  const logger = container.resolve("logger") as { info: (m: string) => void };
  logger.info(`[reset-order-sequence] ok=${result.ok} next=${result.nextDisplayId}`);
}
