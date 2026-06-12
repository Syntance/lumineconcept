import type { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

/**
 * CLI: `pnpm --filter @lumine/backend delete-orders`
 *
 * UWAGA: NIEODWRACALNA OPERACJA — usuwa wszystkie zamówienia z bazy.
 * Przed uruchomieniem zrób backup bazy danych.
 */

type Logger = {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
};

export default async function run({ container }: ExecArgs) {
  const logger = container.resolve("logger") as Logger;

  logger.warn("⚠️  USUWANIE WSZYSTKICH ZAMÓWIEŃ — operacja nieodwracalna!");
  logger.info("Sprawdzam zamówienia...");

  try {
    // Resolve order module service
    const orderModuleService = container.resolve(Modules.ORDER);

    // 1. List all orders
    const orders = await orderModuleService.listOrders({}, {
      select: ["id", "display_id", "status"],
      take: 10000,
    });
    
    if (orders.length === 0) {
      logger.info("✓ Brak zamówień do usunięcia.");
      return;
    }

    logger.info(`Znaleziono ${orders.length} zamówień. Usuwam...`);

    let deleted = 0;
    let failed = 0;

    // 2. Delete each order
    for (const order of orders) {
      try {
        await orderModuleService.deleteOrders([order.id]);
        deleted++;
        const displayId = order.display_id ?? "—";
        logger.info(`✓ Usunięto zamówienie #${displayId} (${order.id})`);
      } catch (e) {
        failed++;
        logger.error(
          `✗ Nie udało się usunąć ${order.id}: ${(e as Error)?.message ?? e}`,
        );
      }
    }

    logger.info(`
╔═══════════════════════════════════════╗
║  PODSUMOWANIE                         ║
╠═══════════════════════════════════════╣
║  Znalezionych: ${orders.length.toString().padEnd(22)} ║
║  Usuniętych:   ${deleted.toString().padEnd(22)} ║
║  Błędy:        ${failed.toString().padEnd(22)} ║
╚═══════════════════════════════════════╝
    `);

    if (failed > 0) {
      logger.warn("⚠️  Niektóre zamówienia nie zostały usunięte — sprawdź logi powyżej.");
      process.exitCode = 1;
    } else {
      logger.info("✓ Wszystkie zamówienia zostały usunięte.");
    }
  } catch (e) {
    logger.error(`✗ Krytyczny błąd: ${(e as Error)?.message ?? e}`);
    console.error(e);
    process.exitCode = 1;
  }
}
