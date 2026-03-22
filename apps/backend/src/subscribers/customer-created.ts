import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

interface CustomerData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export default async function customerCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerService = container.resolve("customer") as {
    retrieve: (id: string) => Promise<CustomerData>;
  };

  const customer = await customerService.retrieve(event.data.id);

  await syncToMailerLite(customer);
}

async function syncToMailerLite(customer: CustomerData) {
  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) return;

  try {
    await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email: customer.email,
        fields: {
          name: customer.first_name,
          last_name: customer.last_name,
        },
        groups: process.env.MAILERLITE_GROUP_ID
          ? [process.env.MAILERLITE_GROUP_ID]
          : [],
        status: "active",
      }),
    });
  } catch (error) {
    console.error("MailerLite sync error:", error);
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
};
