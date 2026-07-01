const BASE = "https://medusa-backend-lumineconceptpl.up.railway.app";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;
const ORDER_ID = process.env.ORDER_ID;

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login ${res.status}: ${await res.text()}`);
  return (await res.json()).token;
}

async function main() {
  const token = await login();
  const h = { Authorization: `Bearer ${token}` };
  const fields = [
    "id", "display_id", "status", "payment_status", "fulfillment_status",
    "fulfillments.id", "fulfillments.provider_id", "fulfillments.shipped_at",
    "fulfillments.delivered_at", "fulfillments.canceled_at", "fulfillments.created_at",
    "fulfillments.data", "fulfillments.labels.tracking_number", "fulfillments.labels.tracking_url",
    "fulfillments.packed_at",
  ].join(",");
  const res = await fetch(`${BASE}/admin/orders/${ORDER_ID}?fields=${fields}`, { headers: h });
  const text = await res.text();
  if (!res.ok) { console.log("ERR", res.status, text); return; }
  const { order } = JSON.parse(text);
  console.log("status:", order.status, "| payment_status:", order.payment_status, "| fulfillment_status:", order.fulfillment_status);
  for (const f of order.fulfillments ?? []) {
    console.log(`\nfulfillment ${f.id}`);
    console.log(`  provider_id=${f.provider_id} created_at=${f.created_at}`);
    console.log(`  packed_at=${f.packed_at} shipped_at=${f.shipped_at} delivered_at=${f.delivered_at} canceled_at=${f.canceled_at}`);
    console.log(`  labels=${JSON.stringify(f.labels ?? [])}`);
    console.log(`  data=${JSON.stringify(f.data ?? {})}`);
  }
}
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
