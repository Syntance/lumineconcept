const BASE = "https://medusa-backend-lumineconceptpl.up.railway.app";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;
const P24 = "pp_przelewy24_przelewy24";

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
  const token = await login();
  const h = { Authorization: `Bearer ${token}` };
  const fields = [
    "id", "display_id", "status", "payment_status", "created_at", "total", "email",
    "payment_collections.id", "payment_collections.status",
    "payment_collections.payments.id", "payment_collections.payments.provider_id",
    "payment_collections.payments.captured_at", "payment_collections.payments.canceled_at",
    "payment_collections.payment_sessions.provider_id",
    "payment_collections.payment_sessions.status",
    "payment_collections.payment_sessions.data",
  ].join(",");

  const stuck = [];
  let count = Infinity;
  for (let offset = 0; offset < count; offset += 100) {
    const res = await fetch(`${BASE}/admin/orders?limit=100&offset=${offset}&order=-display_id&fields=${fields}`, { headers: h });
    const text = await res.text();
    if (!res.ok) throw new Error(`orders ${res.status}: ${text}`);
    const j = JSON.parse(text);
    count = j.count;
    for (const o of j.orders) {
      const pcs = o.payment_collections ?? [];
      const hasP24Session = pcs.some((pc) =>
        (pc.payment_sessions ?? []).some((s) => s.provider_id === P24));
      const hasCapturedPayment = pcs.some((pc) =>
        (pc.payments ?? []).some((p) => p.captured_at && !p.canceled_at));
      const notPaid = o.payment_status === "not_paid" || o.payment_status === "awaiting";
      if (hasP24Session && notPaid && !hasCapturedPayment) {
        const sess = pcs.flatMap((pc) => pc.payment_sessions ?? []).find((s) => s.provider_id === P24);
        stuck.push({
          display_id: o.display_id,
          id: o.id,
          status: o.status,
          payment_status: o.payment_status,
          created_at: o.created_at,
          total: o.total,
          session_status: sess?.status,
          p24_session_id: sess?.data?.p24_session_id ?? sess?.data?.sessionId,
        });
      }
    }
    if (!j.orders.length) break;
  }

  console.log(`Łącznie zamówień: ${count}`);
  console.log(`Utknięte P24 (sesja P24, nieopłacone, brak captured payment): ${stuck.length}\n`);
  for (const s of stuck) {
    console.log(`#${s.display_id} | ${s.id} | status=${s.status} pay=${s.payment_status} sess=${s.session_status} | total=${s.total} | ${s.created_at} | p24=${s.p24_session_id}`);
  }
}

main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
