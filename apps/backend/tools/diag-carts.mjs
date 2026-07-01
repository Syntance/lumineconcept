const BASE = "https://medusa-backend-lumineconceptpl.up.railway.app";
const EMAIL = process.env.MEDUSA_ADMIN_EMAIL;
const PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD;
const CARTS = (process.env.CART_IDS || "").split(",").filter(Boolean);

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
  for (const id of CARTS) {
    const res = await fetch(`${BASE}/admin/carts/${id}?fields=id,completed_at,email,created_at,updated_at`, { headers: h });
    const text = await res.text();
    if (!res.ok) { console.log(id, "ERR", res.status, text.slice(0,200)); continue; }
    const { cart } = JSON.parse(text);
    console.log(`cart ${cart.id}`);
    console.log(`  completed_at=${cart.completed_at}`);
    console.log(`  created_at=${cart.created_at} updated_at=${cart.updated_at} email=${cart.email}`);
  }
}
main().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
