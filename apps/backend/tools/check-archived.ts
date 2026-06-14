const u = "https://medusa-backend-lumineconceptpl.up.railway.app";
async function main() {
  const a = await fetch(`${u}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lumie.strona@gmail.com", password: "lumine.strona123" }),
  });
  const { token } = (await a.json()) as { token: string };
  const get = await fetch(`${u}/admin/orders/order_01KPNMX489V2TZMH7HQJ9S4APC`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await get.json();
  console.log("order1 status", j.order?.status);
  const list = await fetch(`${u}/admin/orders?limit=1&status=archived`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const lj = await list.json();
  console.log("archived count filter", lj.count);
  const all = await fetch(`${u}/admin/orders?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const aj = await all.json();
  console.log("all count", aj.count);
}
main();
