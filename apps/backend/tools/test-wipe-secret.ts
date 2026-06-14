const u = "https://medusa-backend-lumineconceptpl.up.railway.app";
const pk = "pk_80a621ecc05981994cc4ef0f7fa66ebd33f36edeebc5deff5db93e514bcc6673";

async function main() {
  const secret = process.env.WIPE_SECRET!;
  const res = await fetch(`${u}/store/custom/wipe-orders`, {
    method: "POST",
    headers: {
      "x-order-email-secret": secret,
      "x-publishable-api-key": pk,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  console.log(res.status, await res.text());
}

main();
