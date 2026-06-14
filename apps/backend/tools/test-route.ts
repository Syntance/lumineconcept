async function test(path: string) {
  const res = await fetch(`https://medusa-backend-lumineconceptpl.up.railway.app${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  console.log(path, res.status, (await res.text()).slice(0, 120));
}

async function main() {
  await test("/store/custom/notify-order-placed");
  await test("/store/custom/wipe-orders");
}

main();
