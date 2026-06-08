/**
 * Jednorazowa korekta emaila admina: lumie.strona → lumine.strona
 * Uruchom: cd apps/backend && npx tsx src/scripts/fix-admin-email.ts
 */
import pg from "pg";

const OLD_EMAIL = "lumie.strona@gmail.com";
const NEW_EMAIL = "lumine.strona@gmail.com";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[fix-admin-email] Brak DATABASE_URL");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    const tables = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND (table_name ILIKE '%auth%' OR table_name ILIKE '%user%')
       ORDER BY table_name`,
    );
    console.log("[fix-admin-email] Tabele:", tables.rows.map((r) => r.table_name).join(", "));

    const probeTables = [
      "provider_identity",
      "auth_identity",
      "user",
    ] as const;

    for (const table of probeTables) {
      const cols = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1`,
        [table],
      );
      const sample = await client.query(`SELECT * FROM "${table}" LIMIT 3`);
      console.log(`[fix-admin-email] ${table} kolumny:`, cols.rows.map((c) => c.column_name).join(", "));
      console.log(`[fix-admin-email] ${table} sample:`, JSON.stringify(sample.rows));
    }

    let updated = 0;

    const textCols = await client.query<{ table: string; col: string }>(
      `SELECT c.table_name AS table, c.column_name AS col
       FROM information_schema.columns c
       WHERE c.table_schema = 'public'
         AND c.data_type IN ('text', 'character varying', 'jsonb')`,
    );

    for (const row of textCols.rows) {
      if (row.col === "deleted_at") continue;
      try {
        const check = await client.query<{ n: string }>(
          `SELECT COUNT(*)::text AS n FROM "${row.table}"
           WHERE "${row.col}"::text LIKE $1`,
          [`%${OLD_EMAIL}%`],
        );
        const n = Number(check.rows[0]?.n ?? 0);
        if (n > 0) {
          await client.query(
            `UPDATE "${row.table}"
             SET "${row.col}" = REPLACE("${row.col}"::text, $1, $2)::${row.col === "provider_metadata" ? "jsonb" : "text"}
             WHERE "${row.col}"::text LIKE $3`,
            [OLD_EMAIL, NEW_EMAIL, `%${OLD_EMAIL}%`],
          );
          console.log(`[fix-admin-email] UPDATE ${row.table}.${row.col} (${n} wierszy)`);
          updated += n;
        }
      } catch {
        /* kolumna nie do UPDATE */
      }
    }

    if (updated === 0) {
      console.log("[fix-admin-email] Nie znaleziono", OLD_EMAIL, "w DB — tworzę użytkownika", NEW_EMAIL);
      console.log("[fix-admin-email] Uruchom na Railway: medusa user -e", NEW_EMAIL, "-p <hasło>");
    } else {
      console.log("[fix-admin-email] OK — zaktualizowano", updated, "wierszy");
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("[fix-admin-email] Błąd:", e instanceof Error ? e.message : e);
  process.exit(1);
});
