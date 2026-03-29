/**
 * Skrypt migracji: dodaje opcje kolorów do wszystkich produktów w Medusa v2.
 *
 * Kolory standardowe:  Bezbarwny, Mleczny, Czarny, Biały
 * Kolory lustrzane:    Złoty, Srebrny, Rosegold, Czerwone, Fioletowy, Zielony, Granatowy
 *
 * Użycie:
 *   MEDUSA_ADMIN_EMAIL=x MEDUSA_ADMIN_PASSWORD=y node scripts/add-color-options.mjs
 */

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD ?? "";

const ALL_COLORS = [
  "Bezbarwny",
  "Mleczny",
  "Czarny",
  "Biały",
  "Złoty",
  "Srebrny",
  "Rosegold",
  "Czerwone",
  "Fioletowy",
  "Zielony",
  "Granatowy",
];

async function getAuthToken() {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.token;
}

async function adminFetch(token, path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Admin API ${options.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Ustaw MEDUSA_ADMIN_EMAIL i MEDUSA_ADMIN_PASSWORD.");
    process.exit(1);
  }

  console.log(`Łączenie z ${BACKEND_URL}...`);
  const token = await getAuthToken();
  console.log("Zalogowano jako admin.\n");

  let offset = 0;
  const limit = 50;
  let totalProcessed = 0;

  while (true) {
    const data = await adminFetch(
      token,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,*options,*options.values`,
    );

    if (data.products.length === 0) break;

    if (offset === 0 && data.products[0]) {
      console.log("Przykładowa struktura produktu:", JSON.stringify(data.products[0], null, 2).slice(0, 1000));
    }

    for (const product of data.products) {
      const options = product.options ?? [];
      const colorOption = options.find(
        (o) => o.title.toLowerCase() === "kolor",
      );

      if (!colorOption) {
        console.log(
          `[NEW] ${product.title} (${product.id}) — brak opcji "Kolor", tworzę...`,
        );

        try {
          const existingOptions = (product.options ?? []).map((o) => ({
            title: o.title,
            values: o.values.map((v) => v.value),
          }));

          await adminFetch(token, `/admin/products/${product.id}`, {
            method: "POST",
            body: JSON.stringify({
              options: [
                ...existingOptions,
                { title: "Kolor", values: ALL_COLORS },
              ],
            }),
          });
          console.log(`  ✓ Dodano opcję "Kolor" z ${ALL_COLORS.length} wartościami`);
        } catch (err) {
          console.error(`  ✗ Błąd: ${err.message}`);
        }
        totalProcessed++;
        continue;
      }

      const existingValues = new Set(
        colorOption.values.map((v) => v.value.toLowerCase()),
      );
      const missingColors = ALL_COLORS.filter(
        (c) => !existingValues.has(c.toLowerCase()),
      );

      if (missingColors.length === 0) {
        console.log(
          `[OK] ${product.title} (${product.id}) — wszystkie kolory istnieją`,
        );
        totalProcessed++;
        continue;
      }

      console.log(
        `[UPDATE] ${product.title} (${product.id}) — dodaję: ${missingColors.join(", ")}`,
      );

      const updatedValues = [
        ...colorOption.values.map((v) => v.value),
        ...missingColors,
      ];

      try {
        await adminFetch(token, `/admin/products/${product.id}`, {
          method: "POST",
          body: JSON.stringify({
            options: options.map((o) =>
              o.id === colorOption.id
                ? { title: o.title, values: updatedValues }
                : { title: o.title, values: (o.values ?? []).map((v) => v.value) },
            ),
          }),
        });
        console.log(`  ✓ Zaktualizowano (dodano ${missingColors.length} kolorów)`);
      } catch (err) {
        console.error(`  ✗ Błąd: ${err.message}`);
      }
      totalProcessed++;
    }

    offset += limit;
    if (offset >= data.count) break;
  }

  console.log(`\nGotowe! Przetworzono ${totalProcessed} produktów.`);
  console.log(
    "\nUWAGA: Po dodaniu wartości opcji, utwórz warianty w panelu Medusa Admin",
    "(każdy wariant = kombinacja koloru + rozmiaru + LED z ceną i stanem).",
  );
}

run().catch((err) => {
  console.error("Krytyczny błąd:", err);
  process.exit(1);
});
