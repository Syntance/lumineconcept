const BASE = "https://medusa-backend-lumineconceptpl.up.railway.app";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;
const DISPLAY_ID = Number(process.env.DISPLAY_ID || "10166");

async function login() {
  const res = await fetch(`${BASE}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login ${res.status}: ${await res.text()}`);
  const { token } = await res.json();
  return token;
}

async function main() {
  const token = await login();
  const h = { Authorization: `Bearer ${token}` };

  const fields = [
    "id", "display_id", "status", "payment_status", "fulfillment_status",
    "total", "currency_code", "created_at", "email",
    "payment_collections.id", "payment_collections.status",
    "payment_collections.amount", "payment_collections.authorized_amount",
    "payment_collections.captured_amount",
    "payment_collections.payments.id", "payment_collections.payments.provider_id",
    "payment_collections.payments.amount", "payment_collections.payments.captured_at",
    "payment_collections.payments.canceled_at",
    "payment_collections.payment_sessions.id",
    "payment_collections.payment_sessions.provider_id",
    "payment_collections.payment_sessions.status",
    "payment_collections.payment_sessions.data",
  ].join(",");

  let found = null;
  for (let offset = 0; offset < 400 && !found; offset += 100) {
    const res = await fetch(
      `${BASE}/admin/orders?limit=100&offset=${offset}&order=-display_id&fields=${fields}`,
      { headers: h },
    );
    const text = await res.text();
    if (!res.ok) throw new Error(`orders ${res.status}: ${text}`);
    const { orders, count } = JSON.parse(text);
    found = orders.find((o) => o.display_id === DISPLAY_ID);
    if (offset === 0) console.log(`(łącznie zamówień: ${count}; najwyższy display_id na stronie: ${orders[0]?.display_id})`);
    if (!orders.length) break;
  }

  if (!found) {
    console.log("Nie znaleziono display_id=", DISPLAY_ID);
    return;
  }
  const o = found;
  console.log("\n=== ORDER ===");
  console.log("id:", o.id);
  console.log("display_id:", o.display_id);
  console.log("status:", o.status);
  console.log("payment_status:", o.payment_status);
  console.log("fulfillment_status:", o.fulfillment_status);
  console.log("total:", o.total, o.currency_code);
  console.log("created_at:", o.created_at);

  console.log("\n=== PAYMENT COLLECTIONS ===");
  for (const pc of o.payment_collections ?? []) {
    console.log(`- collection ${pc.id} | status=${pc.status} | amount=${pc.amount} | authorized=${pc.authorized_amount} | captured=${pc.captured_amount}`);
    for (const p of pc.payments ?? []) {
      console.log(`    payment ${p.id} | provider=${p.provider_id} | amount=${p.amount} | captured_at=${p.captured_at} | canceled_at=${p.canceled_at}`);
    }
    for (const s of pc.payment_sessions ?? []) {
      const d = s.data ?? {};
      console.log(`    session ${s.id} | provider=${s.provider_id} | status=${s.status}`);
      console.log(`        data.status=${d.status} sessionId=${d.p24_session_id ?? d.sessionId} p24_order_id=${d.order_id ?? d.orderId} method=${d.p24_method_id}`);
    }
  }
  console.log("\nORDER_ID=" + o.id);
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
