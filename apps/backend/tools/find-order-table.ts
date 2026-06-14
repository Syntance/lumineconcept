import { Client } from "pg";

const url =
  "postgresql://postgres:OFZkowarSgjsVLVREpZYymcKSrwTtIsm@yamabiko.proxy.rlwy.net:27306/railway";

async function main() {
  const c = new Client({ connectionString: url });
  await c.connect();
  const r = await c.query(
    `SELECT schemaname, tablename FROM pg_tables WHERE tablename LIKE '%order%' ORDER BY 1,2`,
  );
  console.log(r.rows);
  const any = await c.query(
    `SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'order'`,
  );
  console.log("order table", any.rows);
  await c.end();
}

main();
