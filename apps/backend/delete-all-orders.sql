-- UWAGA: NIEODWRACALNA OPERACJA
-- Backup przed wykonaniem: pg_dump -U postgres -d lumineconcept > backup.sql

BEGIN;

-- 1. Usuń powiązane fulfillment items
DELETE FROM fulfillment_item 
WHERE fulfillment_id IN (SELECT id FROM fulfillment WHERE order_id IN (SELECT id FROM "order"));

-- 2. Usuń fulfillments
DELETE FROM fulfillment WHERE order_id IN (SELECT id FROM "order");

-- 3. Usuń order changes
DELETE FROM order_change WHERE order_id IN (SELECT id FROM "order");

-- 4. Usuń order change actions
DELETE FROM order_change_action WHERE order_change_id IN (SELECT id FROM order_change WHERE order_id IN (SELECT id FROM "order"));

-- 5. Usuń order items
DELETE FROM order_item WHERE order_id IN (SELECT id FROM "order");

-- 6. Usuń payment sessions powiązane z zamówieniami
DELETE FROM payment_session 
WHERE payment_collection_id IN (
  SELECT pc.payment_collection_id 
  FROM cart_payment_collection cpc
  JOIN "order" o ON o.cart_id = cpc.cart_id
  JOIN payment_collection pc ON pc.id = cpc.payment_collection_id
);

-- 7. Usuń payments powiązane z zamówieniami
DELETE FROM payment 
WHERE payment_collection_id IN (
  SELECT pc.payment_collection_id 
  FROM cart_payment_collection cpc
  JOIN "order" o ON o.cart_id = cpc.cart_id
  JOIN payment_collection pc ON pc.id = cpc.payment_collection_id
);

-- 8. Usuń shipping methods
DELETE FROM order_shipping_method WHERE order_id IN (SELECT id FROM "order");

-- 9. Na końcu usuń zamówienia
DELETE FROM "order";

COMMIT;

-- Sprawdź ile pozostało
SELECT COUNT(*) as remaining_orders FROM "order";
