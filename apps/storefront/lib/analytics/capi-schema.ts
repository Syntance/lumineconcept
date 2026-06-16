import { z } from "zod";

const customDataSchema = z
  .object({
    value: z.number().optional(),
    currency: z.string().max(8).optional(),
    content_name: z.string().max(500).optional(),
    content_category: z.string().max(200).optional(),
    order_id: z.string().max(200).optional(),
  })
  .strict();

export const capiBrowserPayloadSchema = z
  .object({
    event_name: z.string().min(1).max(64),
    event_id: z.uuid(),
    event_source_url: z.url().max(2048),
    user_data: z
      .object({
        email: z.email().optional(),
        phone: z.string().max(32).optional(),
        fbp: z.string().max(256).optional(),
        fbc: z.string().max(256).optional(),
      })
      .strict(),
    custom_data: customDataSchema.optional(),
  })
  .strict();

export type CapiBrowserPayload = z.infer<typeof capiBrowserPayloadSchema>;
