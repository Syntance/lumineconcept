const MEDUSA_URL = "https://medusa-backend-lumineconceptpl.up.railway.app";
async function main() {
  const auth = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "lumie.strona@gmail.com", password: "lumine.strona123" }),
  });
  const { token } = (await auth.json()) as { token: string };
  const res = await fetch(`${MEDUSA_URL}/admin/api-keys?limit=5&type=publishable`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log(await res.text());
}
main();
