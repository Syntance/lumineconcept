const MEDUSA_URL = "https://medusa-backend-lumineconceptpl.up.railway.app";
const secret = process.env.WIPE_SECRET!;
const pk = "pk_80a621ecc05981994cc4ef0f7fa66ebd33f36edeebc5deff5db93e514bcc6673";

async function main() {
  const res = await fetch(`${MEDUSA_URL}/store/custom/wipe-orders`, {
    method: "POST",
    headers: {
      "x-order-email-secret": secret,
      "x-publishable-api-key": pk,
    },
  });
  console.log(res.status, await res.text());
}

main();
