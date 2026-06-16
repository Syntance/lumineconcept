/**
 * Syntance analytics — lokalny rejestr zdarzeń (wariant B).
 * Wszystkie nazwy i properties w snake_case.
 */

import type { AnalyticsSegment } from "../segment";

export type { AnalyticsSegment };

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  /** Cena jednostkowa w PLN (float) — Medusa v2 zwraca wartości dziesiętne, nie grosze. */
  price: number;
  quantity: number;
  item_category?: string;
}

/** Pola doklejane automatycznie przez withContext() — opcjonalne w wywołaniach track(). */
export interface AnalyticsContext {
  page_path?: string;
  locale?: string;
  segment?: AnalyticsSegment;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

export interface EcommerceFields {
  value?: number;
  currency?: string;
  transaction_id?: string;
  items?: EcommerceItem[];
  items_count?: number;
}

export type FormName =
  | "logo3d_wycena"
  | "salony_wycena"
  | "kontakt"
  | "checkout_contact"
  | "checkout_shipping"
  | "checkout_payment"
  | "newsletter"
  | "lead_magnet";

/** ── Standard Syntance ── */

export type AnalyticsEventMap = {
  page_view: AnalyticsContext & {
    title?: string;
    full_url?: string;
  };

  section_view: AnalyticsContext & {
    section: string;
  };

  cta_click: AnalyticsContext & {
    cta_label: string;
    position: string;
    target_url?: string;
  };

  outbound_click: AnalyticsContext & {
    cta_label?: string;
    target_url: string;
  };

  contact_click: AnalyticsContext & {
    cta_label?: string;
    target_url?: string;
  };

  scroll_depth: AnalyticsContext & {
    depth_percent: 25 | 50 | 75 | 100;
  };

  form_start: AnalyticsContext & {
    form_name: FormName;
  };

  form_submit: AnalyticsContext & {
    form_name: FormName;
  };

  lead_submit: AnalyticsContext & {
    form_name: FormName;
    has_logo?: boolean;
    has_photo?: boolean;
    finish?: string;
    led?: string;
    size?: string;
    express?: boolean;
  };

  file_download: AnalyticsContext & {
    form_name?: FormName | string;
    file_name?: string;
    file_url?: string;
  };

  email_signup: AnalyticsContext & {
    source?: string;
    email_domain?: string;
  };

  product_view: AnalyticsContext &
    EcommerceFields & {
      item_id?: string;
      item_name?: string;
    };

  add_to_cart: AnalyticsContext & EcommerceFields;

  remove_from_cart: AnalyticsContext & EcommerceFields;

  begin_checkout: AnalyticsContext & EcommerceFields;

  add_shipping_info: AnalyticsContext &
    EcommerceFields & {
      shipping_method?: string;
    };

  add_payment_info: AnalyticsContext &
    EcommerceFields & {
      payment_method?: string;
    };

  purchase: AnalyticsContext &
    EcommerceFields & {
      payment_method?: string;
      shipping_method?: string;
      checkout_duration_seconds?: number;
      /** Do deduplikacji CAPI — nie wysyłane do GA4. */
      email?: string;
    };

  /** ── GA4 recommended ── */

  search: AnalyticsContext & {
    search_term: string;
    results_count?: number;
  };

  view_item_list: AnalyticsContext &
    EcommerceFields & {
      item_list_name?: string;
    };

  view_cart: AnalyticsContext & EcommerceFields;

  /** ── Rozszerzenia Lumine ── */

  time_on_page: AnalyticsContext & {
    seconds: number;
  };

  form_step: AnalyticsContext & {
    form_name: FormName;
    step_number: 1 | 2 | 3;
  };

  form_abandon: AnalyticsContext & {
    form_name: FormName;
    last_step?: number;
    last_field?: string;
  };

  form_error: AnalyticsContext & {
    form_name: FormName | string;
    field_name?: string;
    error_type?: string;
    step?: number;
  };

  checkout_abandon: AnalyticsContext & {
    last_step?: number;
    value?: number;
    currency?: string;
    has_email?: boolean;
  };

  sample_request: AnalyticsContext & {
    product_id?: string;
  };

  self_segment: AnalyticsContext & {
    segment_choice: string;
  };

  cross_sell_click: AnalyticsContext & {
    from_product?: string;
    to_product?: string;
  };

  referral_code_used: AnalyticsContext & {
    referral_code: string;
  };

  configurator_start: AnalyticsContext & {
    product_id?: string;
  };

  upsell_accepted: AnalyticsContext & {
    product_id?: string;
    upsell_product_id?: string;
  };

  /** rozszerzenie projektu */
  product_filtered: AnalyticsContext & {
    category?: string;
    sizes?: string[];
    materials?: string[];
    finishes?: string[];
    led?: string;
    price_min?: number;
    price_max?: number;
    sort?: string;
    search?: string;
    total_filtered?: number;
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

const EVENT_NAMES = new Set<string>([
  "page_view",
  "section_view",
  "cta_click",
  "outbound_click",
  "contact_click",
  "scroll_depth",
  "form_start",
  "form_submit",
  "lead_submit",
  "file_download",
  "email_signup",
  "product_view",
  "add_to_cart",
  "remove_from_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "search",
  "view_item_list",
  "view_cart",
  "time_on_page",
  "form_step",
  "form_abandon",
  "form_error",
  "checkout_abandon",
  "sample_request",
  "self_segment",
  "cross_sell_click",
  "referral_code_used",
  "configurator_start",
  "upsell_accepted",
  "product_filtered",
]);

export function isAnalyticsEvent(name: string): name is AnalyticsEventName {
  return EVENT_NAMES.has(name);
}
