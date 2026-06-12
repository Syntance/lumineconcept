import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL nie jest ustawione w .env");
  process.exit(1);
}

async function deleteAllOrders() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("✓ Połączono z bazą danych");

    // Sprawdź ile zamówień
    const countBefore = await client.query('SELECT COUNT(*) FROM "order"');
    const total = parseInt(countBefore.rows[0].count);
    
    if (total === 0) {
      console.log("✓ Brak zamówień do usunięcia.");
      await client.end();
      return;
    }

    console.log(`⚠️  Znaleziono ${total} zamówień. Usuwam...`);

    // Wykonaj DELETE queries w transakcji
    await client.query("BEGIN");

    // 1. Fulfillment items
    await client.query(`
      DELETE FROM fulfillment_item 
      WHERE fulfillment_id IN (SELECT id FROM fulfillment WHERE order_id IN (SELECT id FROM "order"))
    `);

    // 2. Fulfillments
    await client.query('DELETE FROM fulfillment WHERE order_id IN (SELECT id FROM "order")');

    // 3. Order changes
    await client.query('DELETE FROM order_change WHERE order_id IN (SELECT id FROM "order")');

    // 4. Order change actions (jeśli istnieje)
    try {
      await client.query('DELETE FROM order_change_action WHERE order_change_id IN (SELECT id FROM order_change WHERE order_id IN (SELECT id FROM "order"))');
    } catch (e) {
      // Tabela może nie istnieć w tej wersji Medusa
    }

    // 5. Order items
    await client.query('DELETE FROM order_item WHERE order_id IN (SELECT id FROM "order")');

    // 6. Payment sessions
    await client.query(`
      DELETE FROM payment_session 
      WHERE payment_collection_id IN (
        SELECT pc.id 
        FROM cart_payment_collection cpc
        JOIN "order" o ON o.cart_id = cpc.cart_id
        JOIN payment_collection pc ON pc.id = cpc.payment_collection_id
      )
    `);

    // 7. Payments
    await client.query(`
      DELETE FROM payment 
      WHERE payment_collection_id IN (
        SELECT pc.id 
        FROM cart_payment_collection cpc
        JOIN "order" o ON o.cart_id = cpc.cart_id
        JOIN payment_collection pc ON pc.id = cpc.payment_collection_id
      )
    `);

    // 8. Shipping methods
    await client.query('DELETE FROM order_shipping_method WHERE order_id IN (SELECT id FROM "order")');

    // 9. Orders
    await client.query('DELETE FROM "order"');

    await client.query("COMMIT");

    // Sprawdź wynik
    const countAfter = await client.query('SELECT COUNT(*) FROM "order"');
    const remaining = parseInt(countAfter.rows[0].count);

    console.log(`
╔═══════════════════════════════════════╗
║  PODSUMOWANIE                         ║
╠═══════════════════════════════════════╣
║  Przed:        ${total.toString().padEnd(22)} ║
║  Po:           ${remaining.toString().padEnd(22)} ║
║  Usuniętych:   ${(total - remaining).toString().padEnd(22)} ║
╚═══════════════════════════════════════╝
    `);

    await client.end();
    console.log("✓ Wszystkie zamówienia zostały usunięte.");
  } catch (error) {
    console.error("❌ Błąd:", error);
    await client.query("ROLLBACK").catch(() => {});
    await client.end();
    process.exit(1);
  }
}

deleteAllOrders();
