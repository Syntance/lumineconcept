import { Client } from "pg";

const url =
  "postgresql://postgres:OFZkowarSgjsVLVREpZYymcKSrwTtIsm@yamabiko.proxy.rlwy.net:27306/railway";

async function main() {
  const c = new Client({ connectionString: url });
  await c.connect();
  const tables = await c.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`,
  );
  for (const row of tables.rows) {
    const name = row.table_name as string;
    try {
      const r = await c.query(`SELECT COUNT(1)::int AS c FROM "${name}"`);
      const n = r.rows[0].c as number;
      if (n > 0) console.log(name, n);
    } catch {
      /* skip */
    }
  }
  await c.end();
}

main();
