import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import type { ICustomerModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function customerCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerService: ICustomerModuleService =
    container.resolve(Modules.CUSTOMER);

  const customer = await customerService.retrieveCustomer(event.data.id);

  await syncToMailerLite(customer);
}

async function syncToMailerLite(customer: { email: string; first_name: string | null; last_name: string | null }) {
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
