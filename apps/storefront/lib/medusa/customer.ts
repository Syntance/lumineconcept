import { medusa } from "./client";

export async function getCustomer() {
  try {
    const response = await medusa.store.customer.retrieve();
    return response.customer;
  } catch {
    return null;
  }
}

export async function createCustomer(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}) {
  const response = await medusa.store.customer.create(data);
  return response.customer;
}

export async function loginCustomer(email: string, password: string) {
  const response = await medusa.auth.login("customer", "emailpass", {
    email,
    password,
  });
  return response;
}

export async function logoutCustomer() {
  await medusa.auth.logout();
}

export async function getCustomerOrders(limit = 10, offset = 0) {
  const response = await medusa.store.order.list({
    limit,
    offset,
  });
  return response;
}
