import { Client } from "pg";

const url =
  "postgresql://postgres:OFZkowarSgjsVLVREpZYymcKSrwTtIsm@yamabiko.proxy.rlwy.net:27306/railway";

async function main() {
  const c = new Client({ connectionString: url });
  await c.connect();
  const tables = await c.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%draft%'`,
  );
  console.log("draft tables", tables.rows);
  for (const row of tables.rows) {
    const name = row.table_name as string;
    const r = await c.query(`SELECT COUNT(1)::int AS c FROM "${name}"`);
    console.log(name, r.rows[0].c);
  }
  await c.end();
}

main();
