const BASE = "https://medusa-backend-lumineconceptpl.up.railway.app";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;
const ORDER_ID = process.env.ORDER_ID;
const COLLECTION_ID = process.env.COLLECTION_ID;

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login ${res.status}: ${await res.text()}`);
  return (await res.json()).token;
}

async function main() {
  if (!ORDER_ID || !COLLECTION_ID) throw new Error("Brak ORDER_ID / COLLECTION_ID");
  const token = await login();
  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  console.log(`mark-as-paid collection=${COLLECTION_ID} order=${ORDER_ID}`);
  const res = await fetch(
    `${BASE}/admin/payment-collections/${COLLECTION_ID}/mark-as-paid`,
    { method: "POST", headers: h, body: JSON.stringify({ order_id: ORDER_ID }) },
  );
  const text = await res.text();
  console.log("status", res.status);
  console.log(text.slice(0, 1000));

  // Weryfikacja stanu zamówienia po operacji
  const chk = await fetch(
    `${BASE}/admin/orders/${ORDER_ID}?fields=id,display_id,payment_status,status,payment_collections.status,payment_collections.captured_amount,payment_collections.payments.provider_id,payment_collections.payments.amount,payment_collections.payments.captured_at`,
    { headers: h },
  );
  const chkJson = await chk.json();
  console.log("\n=== po operacji ===");
  console.log(JSON.stringify(chkJson.order, null, 2));
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
