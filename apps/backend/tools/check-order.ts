const u = "https://medusa-backend-lumineconceptpl.up.railway.app";
const id = "order_01KPNMX489V2TZMH7HQJ9S4APC";
async function main() {
  const a = await fetch(`${u}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lumie.strona@gmail.com", password: "lumine.strona123" }),
  });
  const { token } = (await a.json()) as { token: string };
  const list = await fetch(`${u}/admin/orders?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJ = await list.json();
  console.log("count", listJ.count);
  const get = await fetch(`${u}/admin/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("get", get.status, (await get.text()).slice(0, 200));
}
main();
