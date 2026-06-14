import { Client } from "pg";

async function main() {
  const c = new Client({
    connectionString:
      "postgresql://postgres:OFZkowarSgjsVLVREpZYymcKSrwTtIsm@yamabiko.proxy.rlwy.net:27306/railway",
  });
  await c.connect();
  const r = await c.query(`SELECT COUNT(1)::int AS c FROM "order"`);
  console.log("orders", r.rows[0].c);
  const s = await c.query(`SELECT status, COUNT(1)::int AS c FROM "order" GROUP BY status`);
  console.log("by status", s.rows);
  await c.end();
}

main();
