/**
 * Skrypt migracji: dodaje opcje kolorów do wszystkich produktów w Medusa v2.
 *
 * Kolory standardowe:  Bezbarwny, Mleczny, Czarny, Biały
 * Kolory lustrzane:    Złoty, Srebrny, Rosegold, Czerwone, Fioletowy, Zielony, Granatowy
 *
 * Użycie:
 *   npx tsx scripts/add-color-options.ts
 *
 * Zmienne środowiskowe:
 *   MEDUSA_BACKEND_URL  – URL backendu Medusa (domyślnie http://localhost:9000)
 *   MEDUSA_ADMIN_EMAIL  – email konta admin
 *   MEDUSA_ADMIN_PASSWORD – hasło konta admin
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

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function adminFetch(
  token: string,
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Admin API ${options.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

interface ProductOption {
  id: string;
  title: string;
  values: Array<{ id: string; value: string }>;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  options: ProductOption[];
}

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "Ustaw MEDUSA_ADMIN_EMAIL i MEDUSA_ADMIN_PASSWORD jako zmienne środowiskowe.",
    );
    process.exit(1);
  }

  console.log(`Łączenie z ${BACKEND_URL}...`);
  const token = await getAuthToken();
  console.log("Zalogowano jako admin.\n");

  let offset = 0;
  const limit = 50;
  let totalProcessed = 0;

  while (true) {
    const data = (await adminFetch(
      token,
      `/admin/products?limit=${limit}&offset=${offset}&fields=id,title,handle,options.*`,
    )) as { products: Product[]; count: number };

    if (data.products.length === 0) break;

    for (const product of data.products) {
      const colorOption = product.options.find(
        (o) => o.title.toLowerCase() === "kolor",
      );

      if (!colorOption) {
        console.log(
          `[SKIP] ${product.title} (${product.id}) — brak opcji "Kolor", tworzę ją...`,
        );

        try {
          await adminFetch(token, `/admin/products/${product.id}`, {
            method: "POST",
            body: JSON.stringify({
              options: [
                ...product.options.map((o) => ({
                  title: o.title,
                  values: o.values.map((v) => v.value),
                })),
                {
                  title: "Kolor",
                  values: ALL_COLORS,
                },
              ],
            }),
          });
          console.log(`  ✓ Dodano opcję "Kolor" z ${ALL_COLORS.length} wartościami`);
        } catch (err) {
          console.error(`  ✗ Błąd: ${err}`);
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
          `[OK] ${product.title} (${product.id}) — wszystkie kolory już istnieją`,
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
            options: product.options.map((o) =>
              o.id === colorOption.id
                ? { title: o.title, values: updatedValues }
                : { title: o.title, values: o.values.map((v) => v.value) },
            ),
          }),
        });
        console.log(`  ✓ Zaktualizowano (dodano ${missingColors.length} kolorów)`);
      } catch (err) {
        console.error(`  ✗ Błąd: ${err}`);
      }
      totalProcessed++;
    }

    offset += limit;
    if (offset >= data.count) break;
  }

  console.log(`\nGotowe! Przetworzono ${totalProcessed} produktów.`);
  console.log(
    "\nUWAGA: Po dodaniu nowych wartości opcji musisz ręcznie utworzyć warianty",
    "w panelu Medusa Admin (każdy wariant = kombinacja opcji z ceną i stanem magazynowym).",
  );
}

run().catch((err) => {
  console.error("Krytyczny błąd:", err);
  process.exit(1);
});
