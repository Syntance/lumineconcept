const MEDUSA_URL = "https://medusa-backend-lumineconceptpl.up.railway.app";
const pk = "pk_80a621ecc05981994cc4ef0f7fa66ebd33f36edeebc5deff5db93e514bcc6673";

async function main() {
  const res = await fetch(`${MEDUSA_URL}/store/custom/notify-order-placed`, {
    method: "POST",
    headers: {
      "x-order-email-secret": "wrong",
      "x-publishable-api-key": pk,
    },
    body: "{}",
  });
  console.log(res.status, (await res.text()).slice(0, 200));
}

main();
