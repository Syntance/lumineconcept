const u = "https://medusa-backend-lumineconceptpl.up.railway.app";

async function token() {
  const a = await fetch(`${u}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lumie.strona@gmail.com", password: "lumine.strona123" }),
  });
  const { token: t } = (await a.json()) as { token: string };
  return t;
}

async function main() {
  const t = await token();
  const h = { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };

  let offset = 0;
  let total = 0;
  let ok = 0;
  for (;;) {
    const list = await fetch(`${u}/admin/orders?limit=50&offset=${offset}&fields=id,display_id`, { headers: h });
    const j = (await list.json()) as { orders?: Array<{ id: string; display_id?: number }>; count?: number };
    const batch = j.orders ?? [];
    if (!batch.length) break;
    total = j.count ?? total;
    for (const o of batch) {
      const cancel = await fetch(`${u}/admin/orders/${o.id}/cancel`, { method: "POST", headers: h, body: "{}" });
      const archive = await fetch(`${u}/admin/orders/${o.id}/archive`, { method: "POST", headers: h, body: "{}" });
      if (cancel.ok || archive.ok) {
        ok++;
        console.log(`#${o.display_id} cancel=${cancel.status} archive=${archive.status}`);
      } else {
        console.log(`#${o.display_id} FAIL cancel=${cancel.status} archive=${archive.status}`);
      }
    }
    offset += batch.length;
    if (batch.length < 50) break;
  }
  const after = await fetch(`${u}/admin/orders?limit=1`, { headers: h });
  const aj = (await after.json()) as { count?: number };
  console.log("processed", ok, "remaining", aj.count);
}

main().catch(console.error);
