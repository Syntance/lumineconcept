const u = "https://medusa-backend-lumineconceptpl.up.railway.app";
const ids = ["order_01KTQ6SPQ4BEG463X25BTM25TE", "order_01KTS9QVWCYSVPZ8Z76NAZBVXZ"];

async function token() {
  const a = await fetch(`${u}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lumie.strona@gmail.com", password: "lumine.strona123" }),
  });
  return (await a.json()) as { token: string };
}

async function main() {
  const { token: t } = await token();
  const h = { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
  for (const id of ids) {
    const get = await fetch(`${u}/admin/orders/${id}?fields=id,display_id,status,*fulfillments`, { headers: h });
    const { order } = (await get.json()) as {
      order?: { display_id?: number; fulfillments?: Array<{ id: string; canceled_at?: string | null }> };
    };
    console.log("order", order?.display_id, order?.status, "fulfillments", order?.fulfillments?.length);
    for (const f of order?.fulfillments ?? []) {
      if (f.canceled_at) continue;
      const cr = await fetch(`${u}/admin/orders/${id}/fulfillments/${f.id}/cancel`, {
        method: "POST",
        headers: h,
        body: "{}",
      });
      console.log("  cancel fulfillment", f.id, cr.status);
    }
    const c = await fetch(`${u}/admin/orders/${id}/cancel`, { method: "POST", headers: h, body: "{}" });
    const ar = await fetch(`${u}/admin/orders/${id}/archive`, { method: "POST", headers: h, body: "{}" });
    console.log("  cancel", c.status, "archive", ar.status);
  }
}

main();
