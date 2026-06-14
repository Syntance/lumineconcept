const u = "https://medusa-backend-lumineconceptpl.up.railway.app";
const ids = [
  "order_01KTQ6SPQ4BEG463X25BTM25TE",
  "order_01KTS9QVWCYSVPZ8Z76NAZBVXZ",
];

async function main() {
  const a = await fetch(`${u}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lumie.strona@gmail.com", password: "lumine.strona123" }),
  });
  const { token } = (await a.json()) as { token: string };
  const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  for (const id of ids) {
    const c = await fetch(`${u}/admin/orders/${id}/cancel`, { method: "POST", headers: h, body: "{}" });
    const ar = await fetch(`${u}/admin/orders/${id}/archive`, { method: "POST", headers: h, body: "{}" });
    console.log(id, "cancel", c.status, "archive", ar.status, await c.text().catch(() => ""));
  }
}

main();
