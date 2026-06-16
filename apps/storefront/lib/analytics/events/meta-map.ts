import type { AnalyticsEventName } from "./registry";

export type MetaStandardEvent =
  | "Lead"
  | "Contact"
  | "CompleteRegistration"
  | "Purchase"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout";

export type MetaEventTarget =
  | { kind: "standard"; event: MetaStandardEvent }
  | { kind: "custom"; event: string };

/** Mapowanie zdarzeń Syntance → Meta Pixel (konwersje). */
export const META_EVENT_MAP: Partial<
  Record<AnalyticsEventName, MetaEventTarget>
> = {
  lead_submit: { kind: "standard", event: "Lead" },
  contact_click: { kind: "standard", event: "Contact" },
  email_signup: { kind: "standard", event: "CompleteRegistration" },
  purchase: { kind: "standard", event: "Purchase" },
  product_view: { kind: "standard", event: "ViewContent" },
  add_to_cart: { kind: "standard", event: "AddToCart" },
  begin_checkout: { kind: "standard", event: "InitiateCheckout" },
  file_download: { kind: "custom", event: "FileDownload" },
};

export function getMetaEventTarget(
  name: AnalyticsEventName,
): MetaEventTarget | undefined {
  return META_EVENT_MAP[name];
}
