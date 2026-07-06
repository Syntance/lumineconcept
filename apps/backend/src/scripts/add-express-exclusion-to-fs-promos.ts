import type { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { EXPRESS_FEE_SHIPPING_METHOD_NAME } from "../lib/express-fee";

/**
 * CLI: `npx medusa exec ./src/scripts/add-express-exclusion-to-fs-promos.ts`
 *
 * Migracja (06.07.2026): promocje "darmowa dostawa" (100% na shipping_methods)
 * rabatowały też metodę-dopłatę ekspresową — klient dostawał express gratis.
 * Nowe promocje tworzone z magazynu mają target-regułę `name ne <dopłata>`;
 * ten skrypt dopina ją do JUŻ ISTNIEJĄCYCH promocji dostawy (idempotentnie).
 */
export default async function run({ container }: ExecArgs) {
  const logger = container.resolve("logger") as {
    info: (m: string) => void;
    warn: (m: string) => void;
  };
  const promotionModule = container.resolve(Modules.PROMOTION);

  const promotions = await promotionModule.listPromotions(
    {},
    {
      relations: [
        "application_method",
        "application_method.target_rules",
        "application_method.target_rules.values",
      ],
      take: 500,
    },
  );

  let patched = 0;
  for (const promotion of promotions) {
    const method = promotion.application_method;
    if (!method || method.target_type !== "shipping_methods") continue;

    const targetRules = method.target_rules ?? [];
    const already = targetRules.some(
      (rule) =>
        rule.attribute === "name" &&
        rule.operator === "ne" &&
        (rule.values ?? []).some(
          (v) => v.value === EXPRESS_FEE_SHIPPING_METHOD_NAME,
        ),
    );
    if (already) {
      logger.info(`OK (już ma regułę): ${promotion.code}`);
      continue;
    }

    await promotionModule.addPromotionTargetRules(promotion.id, [
      {
        attribute: "name",
        operator: "ne" as never,
        values: [EXPRESS_FEE_SHIPPING_METHOD_NAME],
      },
    ]);
    patched += 1;
    logger.info(`DOPIĘTO regułę wykluczenia: ${promotion.code}`);
  }

  logger.info(`Gotowe — zaktualizowano ${patched} promocji dostawy.`);
}
