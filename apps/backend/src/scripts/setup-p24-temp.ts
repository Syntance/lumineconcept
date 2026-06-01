import type { ExecArgs } from "@medusajs/framework/types";
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows";

const P24_PROVIDER_ID = "pp_przelewy24";

export default async function run({ container }: ExecArgs) {
  const query = container.resolve("query") as {
    graph: (args: {
      entity: string;
      fields: string[];
    }) => Promise<{ data: Array<{ id: string; name?: string; payment_providers?: Array<{ id?: string }> }> }>;
  };

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
  });

  console.log(`[setup-p24] Znaleziono ${regions.length} regionów`);

  for (const region of regions) {
    const currentIds = (region.payment_providers ?? [])
      .map((p) => p?.id)
      .filter((id): id is string => typeof id === "string");

    if (currentIds.includes(P24_PROVIDER_ID)) {
      console.log(`[setup-p24] Region "${region.name ?? region.id}" już ma ${P24_PROVIDER_ID}`);
      continue;
    }

    const nextIds = Array.from(new Set([...currentIds, P24_PROVIDER_ID]));

    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: nextIds },
      },
    });

    console.log(`[setup-p24] Region "${region.name ?? region.id}" → dodano ${P24_PROVIDER_ID}`);
  }

  console.log("[setup-p24] Gotowe!");
}
