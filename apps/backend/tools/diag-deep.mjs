const BASE = "https://medusa-backend-lumineconceptpl.up.railway.app";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;
const IDS = (process.env.ORDER_IDS || "").split(",").filter(Boolean);

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
    "id", "display_id", "status", "payment_status", "created_at", "updated_at", "metadata",
    "*payment_collections",
    "payment_collections.payments.id", "payment_collections.payments.provider_id",
    "payment_collections.payments.amount", "payment_collections.payments.captured_at",
    "payment_collections.payments.canceled_at",
    "payment_collections.payments.captures.id", "payment_collections.payments.captures.amount",
    "payment_collections.payment_sessions.id",
    "payment_collections.payment_sessions.provider_id",
    "payment_collections.payment_sessions.status",
    "payment_collections.payment_sessions.created_at",
    "payment_collections.payment_sessions.data",
  ].join(",");

  for (const id of IDS) {
    const res = await fetch(`${BASE}/admin/orders/${id}?fields=${fields}`, { headers: h });
    const text = await res.text();
    if (!res.ok) { console.log(id, "ERR", res.status, text.slice(0, 300)); continue; }
    const { order: o } = JSON.parse(text);
    console.log("\n============================================");
    console.log(`#${o.display_id} ${o.id}`);
    console.log("status:", o.status, "| payment_status:", o.payment_status);
    console.log("created_at:", o.created_at, "| updated_at:", o.updated_at);
    console.log("metadata:", JSON.stringify(o.metadata));
    for (const pc of o.payment_collections ?? []) {
      console.log(`\n  payment_collection ${pc.id}`);
      console.log(`    status=${pc.status} amount=${pc.amount} authorized=${pc.authorized_amount} captured=${pc.captured_amount} refunded=${pc.refunded_amount}`);
      console.log(`    created_at=${pc.created_at}`);
      const sessions = pc.payment_sessions ?? [];
      console.log(`    sessions (${sessions.length}):`);
      for (const s of sessions) {
        console.log(`      - ${s.id} provider=${s.provider_id} status=${s.status} created=${s.created_at}`);
        console.log(`        data=${JSON.stringify(s.data)}`);
      }
      const payments = pc.payments ?? [];
      console.log(`    payments (${payments.length}):`);
      for (const p of payments) {
        console.log(`      - ${p.id} provider=${p.provider_id} amount=${p.amount} captured_at=${p.captured_at} canceled_at=${p.canceled_at} captures=${JSON.stringify(p.captures ?? [])}`);
      }
    }
  }
}

main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
