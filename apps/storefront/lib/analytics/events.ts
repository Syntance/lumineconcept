import { capturePostHogEvent } from "./posthog";
import { trackMetaEvent, trackMetaCustomEvent } from "./meta-pixel";

export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  capturePostHogEvent(eventName, properties);
  trackMetaCustomEvent(eventName, properties);
}

export function trackPageView(url: string, title: string) {
  capturePostHogEvent("$pageview", { $current_url: url, $title: title });
}

export function trackProductViewed(product: {
  id: string;
  title: string;
  price: number;
  currency: string;
  category?: string;
}) {
  capturePostHogEvent("product_viewed", product);
  trackMetaEvent("ViewContent", {
    content_ids: [product.id],
    content_type: "product",
    content_name: product.title,
    value: product.price / 100,
    currency: product.currency,
  });
}

export function trackAddToCart(item: {
  id: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
}) {
  capturePostHogEvent("add_to_cart", item);
  trackMetaEvent("AddToCart", {
    content_ids: [item.id],
    content_type: "product",
    content_name: item.title,
    value: (item.price * item.quantity) / 100,
    currency: item.currency,
  });
}

export function trackBeginCheckout(cart: {
  total: number;
  currency: string;
  items: Array<{ id: string; title: string; price: number; quantity: number }>;
}) {
  capturePostHogEvent("begin_checkout", cart);
  trackMetaEvent("InitiateCheckout", {
    content_ids: cart.items.map((i) => i.id),
    content_type: "product",
    value: cart.total / 100,
    currency: cart.currency,
    num_items: cart.items.length,
  });
}

export function trackPurchase(order: {
  id: string;
  total: number;
  currency: string;
  items: Array<{ id: string; title: string; price: number; quantity: number }>;
}) {
  capturePostHogEvent("purchase", order);
  trackMetaEvent("Purchase", {
    content_ids: order.items.map((i) => i.id),
    content_type: "product",
    value: order.total / 100,
    currency: order.currency,
    num_items: order.items.length,
  });
}

export function trackSearchQuery(query: string, resultsCount: number) {
  trackEvent("search_query", { query, results_count: resultsCount });
}

export function trackNewsletterSignup(email: string) {
  trackEvent("newsletter_signup", { email_domain: email.split("@")[1] });
}

export function trackCtaClick(ctaName: string, location: string) {
  trackEvent("cta_click", { cta_name: ctaName, location });
}

export function trackFormStart(formName: string) {
  trackEvent("form_start", { form_name: formName });
}

export function trackFormSubmit(formName: string) {
  trackEvent("form_submit", { form_name: formName });
}
