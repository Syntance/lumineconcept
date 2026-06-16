/**

 * Meta Pixel — lazy load po zgodzie marketing. Jedyny klient-side punkt fbq().

 */



declare global {

  interface Window {

    fbq: (

      action: string,

      eventOrId: string,

      params?: Record<string, unknown>,

      options?: { eventID?: string },

    ) => void;

    _fbq: unknown;

  }

}



import { getMetaEventTarget } from "../events/meta-map";

import type { AnalyticsEventName } from "../events/registry";

import { purchaseEventId } from "../purchase-event-id";

import { ANALYTICS_SEGMENT } from "../segment";

import { isBrowserCapiEvent } from "../capi-browser-allowlist";



const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";



let pixelInitialized = false;

let consentGranted = false;



function readCookie(name: string): string | undefined {

  if (typeof document === "undefined") return undefined;

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

  return match?.[1] ? decodeURIComponent(match[1]) : undefined;

}



export function initMetaPixel(): void {

  if (typeof window === "undefined" || !PIXEL_ID) return;

  if (pixelInitialized) return;



  if (typeof window.fbq !== "function") {

    const queue: unknown[][] = [];

    type FbqShim = {

      (...args: unknown[]): void;

      callMethod?: (...args: unknown[]) => void;

      queue: unknown[][];

      loaded: boolean;

      version: string;

    };

    const fbq = function (this: unknown, ...args: unknown[]) {

      if (fbq.callMethod) {

        fbq.callMethod(...args);

      } else {

        queue.push(args);

      }

    } as unknown as FbqShim;

    fbq.queue = queue;

    fbq.loaded = true;

    fbq.version = "2.0";

    window.fbq = fbq as unknown as typeof window.fbq;



    const script = document.createElement("script");

    script.async = true;

    script.src = "https://connect.facebook.net/en_US/fbevents.js";

    document.head.appendChild(script);

  }



  window.fbq("init", PIXEL_ID);

  window.fbq("consent", consentGranted ? "grant" : "revoke");

  pixelInitialized = true;

}



export function grantConsent(): void {

  consentGranted = true;

  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  window.fbq("consent", "grant");

}



export function revokeConsent(): void {

  consentGranted = false;

  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  window.fbq("consent", "revoke");

}



function buildMetaParams(

  name: AnalyticsEventName,

  payload: Record<string, unknown>,

): Record<string, unknown> {

  const params: Record<string, unknown> = {

    content_category: ANALYTICS_SEGMENT,

  };



  if (payload.value != null) params.value = payload.value;

  if (payload.currency != null) params.currency = payload.currency;

  if (payload.transaction_id != null) {

    params.order_id = payload.transaction_id;

  }

  if (Array.isArray(payload.items) && payload.items.length > 0) {

    const first = payload.items[0] as Record<string, unknown>;

    if (first.item_id) params.content_ids = [first.item_id];

    if (first.item_name) params.content_name = first.item_name;

  }

  if (name === "lead_submit" && payload.form_name) {

    params.content_name = `formularz-${String(payload.form_name)}`;

  }

  if (name === "search" && payload.search_term) {

    params.search_string = payload.search_term;

  }



  return params;

}



function pickCapiCustomData(
  params: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  if (params.value != null) out.value = params.value;
  if (params.currency != null) out.currency = params.currency;
  if (params.content_name != null) out.content_name = params.content_name;
  if (params.content_category != null) {
    out.content_category = params.content_category;
  }
  if (params.order_id != null) out.order_id = params.order_id;
  return Object.keys(out).length > 0 ? out : undefined;
}

async function sendCapiEvent(args: {

  event_name: string;

  event_id: string;

  custom_data?: Record<string, unknown>;

  email?: string;

}): Promise<void> {

  if (typeof window === "undefined") return;

  if (process.env.NEXT_PUBLIC_CAPI_ENABLED !== "true") return;



  try {

    await fetch("/api/capi", {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

      },

      body: JSON.stringify({

        event_name: args.event_name,

        event_id: args.event_id,

        event_source_url: window.location.href,

        user_data: {

          email: args.email,

          fbp: readCookie("_fbp"),

          fbc: readCookie("_fbc"),

        },

        custom_data: pickCapiCustomData(args.custom_data ?? {}),

      }),

      signal: AbortSignal.timeout(30_000),

    });

  } catch {

    /* CAPI opcjonalny — nie blokujemy UI */

  }

}



/**

 * event_id musi być identyczny w Pixel eventID i CAPI event_id — Meta deduplikuje konwersje.

 */

export function fbqTrack(

  name: AnalyticsEventName,

  payload: Record<string, unknown>,

  eventId: string,

): void {

  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  if (!consentGranted) return;



  const target = getMetaEventTarget(name);

  if (!target) return;



  const params = buildMetaParams(name, payload);

  const metaEventName = target.event;



  if (target.kind === "custom") {

    window.fbq("trackCustom", metaEventName, params, { eventID: eventId });

  } else {

    window.fbq("track", metaEventName, params, { eventID: eventId });

  }



  // Purchase CAPI — wyłącznie server-side (subscriber order.placed).
  // Pozostałe eventy ecommerce (ViewContent, AddToCart, InitiateCheckout) nie są
  // w allowliście przeglądarki — CAPI obsługuje je opcjonalnie tylko dla Lead/Contact/CompleteRegistration.
  if (metaEventName === "Purchase") return;

  if (!isBrowserCapiEvent(metaEventName)) return;



  void sendCapiEvent({

    event_name: metaEventName,

    event_id: eventId,

    custom_data: params,

    email:

      typeof payload.email === "string"

        ? payload.email

        : undefined,

  });

}



export function resolveMetaEventId(

  name: AnalyticsEventName,

  payload: Record<string, unknown>,

  fallbackEventId: string,

): string {

  if (

    name === "purchase" &&

    typeof payload.transaction_id === "string" &&

    payload.transaction_id.trim()

  ) {

    return purchaseEventId(payload.transaction_id.trim());

  }

  return fallbackEventId;

}


