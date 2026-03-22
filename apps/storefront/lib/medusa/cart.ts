import { medusa } from "./client";

export async function createCart() {
  const response = await medusa.store.cart.create({
    region_id: await getPolishRegionId(),
  });
  return response.cart;
}

export async function getCart(cartId: string) {
  const response = await medusa.store.cart.retrieve(cartId);
  return response.cart;
}

export async function addLineItem(cartId: string, variantId: string, quantity: number) {
  const response = await medusa.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  });
  return response.cart;
}

export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
) {
  const response = await medusa.store.cart.updateLineItem(cartId, lineItemId, {
    quantity,
  });
  return response.cart;
}

export async function removeLineItem(cartId: string, lineItemId: string) {
  const response = await medusa.store.cart.deleteLineItem(cartId, lineItemId);
  return response;
}

async function getPolishRegionId(): Promise<string> {
  const response = await medusa.store.region.list();
  const plRegion = response.regions.find(
    (r) => r.countries?.some((c) => c.iso_2 === "pl"),
  );
  if (!plRegion) {
    throw new Error("Region PL nie znaleziony. Skonfiguruj region w Medusa Admin.");
  }
  return plRegion.id;
}
