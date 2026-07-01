const merchantId = process.env.PRZELEWY24_MERCHANT_ID;
const posId = process.env.PRZELEWY24_POS_ID || merchantId;
const apiKey = process.env.PRZELEWY24_API_KEY;
const sandbox = process.env.PRZELEWY24_SANDBOX === "true";
const host = sandbox ? "https://sandbox.przelewy24.pl" : "https://secure.przelewy24.pl";
const SESSION_IDS = (process.env.SESSION_IDS || "").split(",").filter(Boolean);

async function main() {
  const credentials = Buffer.from(`${posId}:${apiKey}`).toString("base64");
  for (const sessionId of SESSION_IDS) {
    const res = await fetch(`${host}/api/v1/transaction/by/sessionId/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    const text = await res.text();
    console.log(`\n=== sessionId=${sessionId} → HTTP ${res.status} ===`);
    console.log(text);
  }
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
