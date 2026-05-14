/**
 * Eventy analityczne — zgodne z Notion "Analityka i konwersje (KPI strony)" → sekcja 1.
 *
 * Konwencja:
 * - nazwy: `snake_case` (PostHog event), property: `camelCase`
 * - każdy event MUSI mieć property `segment` (`beauty` | `edu`) — dorzucane automatycznie
 * - `pagePath` dorzucany do każdego eventa (do filtrowania funneli per ścieżka)
 *
 * Mapowanie Meta Pixel (priorytet AEM, max 8 eventów per domena):
 * 1. Purchase             — `purchase`
 * 2. Lead                 — `form_submit` (formularze wycenowe)
 * 3. InitiateCheckout     — `checkout_start`
 * 4. AddToCart            — `cart_add`
 * 5. CompleteRegistration — `email_signup`
 * 6. ViewContent          — `product_view` (i landing pages)
 * 7. Contact              — `cta_click` z intencją kontaktu
 * 8. Search               — wyszukiwarka / filtrowanie
 *
 * Stare nazwy z poprzedniej wersji (`add_to_cart`, `begin_checkout`, …) są
 * eksportowane jako wrappery — nic w UI nie wymaga zmiany API.
 */

import {
  trackMetaCustomEvent,
  trackMetaEvent,
} from "./meta-pixel";
import { capturePostHogEvent } from "./posthog";
import { getPageContext, getShortPageContext } from "./page-context";
import { ANALYTICS_SEGMENT } from "./segment";

type EventProps = Record<string, unknown> | undefined;

function withShortContext(props?: object): Record<string, unknown> {
  const ctx = getShortPageContext();
  return {
    segment: ANALYTICS_SEGMENT,
    ...(ctx ? { pagePath: ctx.pagePath } : {}),
    ...((props ?? {}) as Record<string, unknown>),
  };
}

/* ───────────────────────── Eventy podstawowe ───────────────────────── */

/**
 * `page_view` — odpalany przy każdej zmianie ścieżki w Next.js Routerze.
 * Notion: pełen kontekst UTM + referrer.
 */
export function trackPageView(extra?: { url?: string; title?: string }) {
  const ctx = getPageContext();
  if (!ctx) return;
  capturePostHogEvent("page_view", {
    ...ctx,
    ...(extra?.url ? { fullUrl: extra.url } : {}),
    ...(extra?.title ? { title: extra.title } : {}),
  });
}

/** Pixel `PageView` — osobno, bo zgoda na analytics ≠ zgoda na marketing. */
export function trackPixelPageView() {
  trackMetaEvent("PageView");
}

/**
 * `scroll_depth` — Intersection Observer na 25/50/75/100% wysokości strony.
 * Wywoływać raz per próg per pageview.
 */
export function trackScrollDepth(depthPercent: 25 | 50 | 75 | 100) {
  capturePostHogEvent("scroll_depth", withShortContext({ depthPercent }));
}

/**
 * `scroll_to_section` — Intersection Observer na anchor sekcji
 * (`formularz`, `cennik`, `galeria`, `opinie`, `faq`, `warianty`, `proces`).
 * Wywoływać raz per sekcja per pageview.
 */
export function trackScrollToSection(sectionId: string) {
  capturePostHogEvent("scroll_to_section", withShortContext({ sectionId }));
}

/** `time_on_page` — czas aktywny (tab widoczny) wysyłany przy beforeunload/visibility hidden. */
export function trackTimeOnPage(seconds: number) {
  capturePostHogEvent(
    "time_on_page",
    withShortContext({ seconds: Math.round(seconds) }),
  );
}

/**
 * `cta_click` — każdy istotny CTA (button / link z intencją konwersji).
 * `position`: `hero | mid | bottom | sticky | cross-sell | header | drawer`.
 */
export function trackCtaClick(args: {
  ctaLabel: string;
  position: string;
  targetUrl?: string;
  /** Gdy klik jest "kontaktowy" (mailto, tel, IG, otwarcie formularza) — odpalamy też Pixel `Contact`. */
  contactIntent?: boolean;
}) {
  const { ctaLabel, position, targetUrl, contactIntent } = args;
  capturePostHogEvent(
    "cta_click",
    withShortContext({ ctaLabel, position, targetUrl }),
  );
  if (contactIntent) {
    trackMetaEvent("Contact", { content_category: ANALYTICS_SEGMENT });
  }
}

/* ───────────────────────── Formularze ───────────────────────── */

export type FormName =
  | "logo3d_wycena"
  | "salony_wycena"
  | "kontakt"
  | "checkout_contact"
  | "checkout_shipping"
  | "checkout_payment"
  | "newsletter"
  | "lead_magnet";

export function trackFormStart(formName: FormName) {
  capturePostHogEvent("form_start", withShortContext({ formName }));
}

export function trackFormStep(formName: FormName, stepNumber: 1 | 2 | 3) {
  capturePostHogEvent(
    "form_step",
    withShortContext({ formName, stepNumber }),
  );
}

export interface FormSubmitDetails {
  formName: FormName;
  /** Dla formularzy wycenowych — opcjonalne, do raportów. */
  hasLogo?: boolean;
  hasPhoto?: boolean;
  finish?: "matowe_uv" | "blyszczace" | "lustrzane" | "nie_wiem" | string;
  led?: "rgb" | "bialy" | "bez" | "nie_wiem" | string;
  size?: "S" | "M" | "L" | "custom" | string;
  express?: boolean;
}

export function trackFormSubmit(
  detailsOrName: FormSubmitDetails | FormName,
) {
  const details: FormSubmitDetails =
    typeof detailsOrName === "string"
      ? { formName: detailsOrName }
      : detailsOrName;

  capturePostHogEvent("form_submit", withShortContext(details));

  // Pixel `Lead` — tylko formularze wycenowe / kontaktowe (nie checkout).
  const leadForms: FormName[] = [
    "logo3d_wycena",
    "salony_wycena",
    "kontakt",
  ];
  if (leadForms.includes(details.formName)) {
    trackMetaEvent("Lead", {
      content_name: `formularz-${details.formName}`,
      content_category: ANALYTICS_SEGMENT,
    });
  }
}

export function trackFormAbandon(args: {
  formName: FormName;
  lastStep?: number;
  lastField?: string;
}) {
  capturePostHogEvent("form_abandon", withShortContext(args));
}

export function trackFormError(args: {
  formName: FormName;
  fieldName: string;
  errorType: "required" | "format" | "size" | "server" | string;
}) {
  capturePostHogEvent("form_error", withShortContext(args));
}

/* ───────────────────────── Sklep 🛒 ───────────────────────── */

export interface ProductSummary {
  id: string;
  title: string;
  price: number;
  currency: string;
  category?: string;
  variant?: string;
}

export function trackProductView(product: ProductSummary) {
  capturePostHogEvent(
    "product_view",
    withShortContext({
      productId: product.id,
      productName: product.title,
      category: product.category,
      price: product.price,
    }),
  );
  trackMetaEvent("ViewContent", {
    content_ids: [product.id],
    content_type: "product",
    content_name: product.title,
    value: product.price,
    currency: product.currency,
  });
}

export function trackCartAdd(item: ProductSummary & { quantity: number }) {
  capturePostHogEvent(
    "cart_add",
    withShortContext({
      productId: item.id,
      productName: item.title,
      value: item.price * item.quantity,
      variant: item.variant,
    }),
  );
  trackMetaEvent("AddToCart", {
    content_ids: [item.id],
    content_type: "product",
    content_name: item.title,
    value: item.price * item.quantity,
    currency: item.currency,
  });
}

export function trackCartRemove(item: { id: string; price: number }) {
  capturePostHogEvent(
    "cart_remove",
    withShortContext({ productId: item.id, value: item.price }),
  );
}

export function trackCartViewed(itemIds: string[]) {
  capturePostHogEvent(
    "cart_view",
    withShortContext({ itemCount: itemIds.length, itemIds }),
  );
}

export interface CartSnapshot {
  total: number;
  currency: string;
  items: Array<{ id: string; title: string; price: number; quantity: number }>;
}

export function trackCheckoutStart(cart: CartSnapshot) {
  capturePostHogEvent(
    "checkout_start",
    withShortContext({
      cartValue: cart.total,
      itemsCount: cart.items.length,
    }),
  );
  trackMetaEvent("InitiateCheckout", {
    content_ids: cart.items.map((i) => i.id),
    content_type: "product",
    value: cart.total,
    currency: cart.currency,
    num_items: cart.items.length,
  });
}

export function trackCheckoutStep(args: {
  stepNumber: 1 | 2 | 3;
  cartValue?: number;
}) {
  capturePostHogEvent("checkout_step", withShortContext(args));
}

export function trackCheckoutAbandon(args: {
  lastStep: 1 | 2 | 3;
  cartValue: number;
  hasEmail: boolean;
}) {
  capturePostHogEvent("checkout_abandon", withShortContext(args));
}

export interface PurchaseDetails {
  id: string;
  total: number;
  currency: string;
  items: Array<{ id: string; title: string; price: number; quantity: number }>;
  paymentMethod?: string;
  shippingMethod?: string;
}

export function trackPurchase(order: PurchaseDetails) {
  capturePostHogEvent(
    "purchase",
    withShortContext({
      orderId: order.id,
      value: order.total,
      itemsCount: order.items.length,
      items: order.items,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
    }),
  );
  trackMetaEvent("Purchase", {
    content_ids: order.items.map((i) => i.id),
    content_type: "product",
    value: order.total,
    currency: order.currency,
    num_items: order.items.length,
  });
}

/* ───────────────────────── Lead capture ───────────────────────── */

export type EmailSignupSource =
  | "popup"
  | "footer"
  | "lead_magnet"
  | "checkout"
  | "newsletter";

export function trackEmailSignup(args: {
  source: EmailSignupSource;
  emailDomain?: string;
}) {
  capturePostHogEvent("email_signup", withShortContext(args));
  trackMetaEvent("CompleteRegistration", {
    content_name: `signup-${args.source}`,
    content_category: ANALYTICS_SEGMENT,
  });
}

export function trackLeadMagnetDownload(magnetName: string) {
  capturePostHogEvent(
    "lead_magnet_download",
    withShortContext({ magnetName }),
  );
}

export function trackSampleRequest(colorRequested?: string) {
  capturePostHogEvent("sample_request", withShortContext({ colorRequested }));
}

/* ───────────────────────── Nawigacja / inne ───────────────────────── */

export function trackSelfSegment(args: {
  selectedSegment: "beauty" | "edu" | "inna" | string;
  referrer?: string | null;
}) {
  capturePostHogEvent("self_segment", withShortContext(args));
}

export function trackCrossSellClick(args: {
  fromProduct?: string;
  toProduct: string;
}) {
  capturePostHogEvent("cross_sell_click", withShortContext(args));
}

export function trackReferralCodeUsed(refCode: string) {
  capturePostHogEvent("referral_code_used", withShortContext({ refCode }));
}

export function trackSearchQuery(query: string, resultsCount: number) {
  capturePostHogEvent(
    "search",
    withShortContext({ searchString: query, resultsCount }),
  );
  trackMetaEvent("Search", {
    search_string: query,
    content_category: ANALYTICS_SEGMENT,
  });
}

/** Lista produktów / filtrowanie — agregowane w Web Analytics. */
export function trackCategoryViewed(category: string, path: string) {
  capturePostHogEvent("category_view", withShortContext({ category, path }));
}

export function trackProductFiltered(filters: Record<string, unknown>) {
  capturePostHogEvent("product_filtered", withShortContext(filters));
}

export function trackDiscountApplied(code: string, discountAmount?: number) {
  capturePostHogEvent(
    "discount_applied",
    withShortContext({ code, discountAmount }),
  );
}

/* ───────────────────────── Generic / debug ───────────────────────── */

/** Dla niestandardowych eventów (np. eksperymentów). PostHog + Pixel custom. */
export function trackEvent(eventName: string, properties?: EventProps) {
  capturePostHogEvent(eventName, withShortContext(properties));
  trackMetaCustomEvent(eventName, properties);
}

/* ───────────────────────── Back-compat aliasy ───────────────────────── */

/** @deprecated używaj `trackProductView` */
export const trackProductViewed = trackProductView;

/** @deprecated używaj `trackCartAdd` */
export function trackAddToCart(item: ProductSummary & { quantity: number }) {
  trackCartAdd(item);
}

/** @deprecated używaj `trackCartRemove` */
export function trackRemoveFromCart(item: { id: string; price: number }) {
  trackCartRemove(item);
}

/** @deprecated używaj `trackCheckoutStart` */
export const trackBeginCheckout = trackCheckoutStart;

/** @deprecated używaj `trackEmailSignup` */
export function trackNewsletterSignup(email: string) {
  trackEmailSignup({
    source: "newsletter",
    emailDomain: email.split("@")[1],
  });
}

/** @deprecated używaj `trackCheckoutStep` */
export function trackCheckoutStepCompleted(stepNumber: 1 | 2 | 3, _label?: string) {
  trackCheckoutStep({ stepNumber });
}

/** @deprecated używaj `trackReferralCodeUsed` */
export const trackReferralApplied = trackReferralCodeUsed;

/** Pixel-only PageView wywoływany po wyrażeniu zgody na marketing — eksport zachowany. */
export function trackMetaPageViewOnly() {
  trackPixelPageView();
}
