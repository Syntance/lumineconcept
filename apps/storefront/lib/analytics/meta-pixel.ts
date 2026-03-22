declare global {
  interface Window {
    fbq: (
      action: string,
      eventOrId: string,
      params?: Record<string, unknown>,
    ) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export function initMetaPixel() {
  if (typeof window === "undefined" || !PIXEL_ID) return;

  if (typeof window.fbq === "function") return;

  const queue: unknown[][] = [];
  const fbq: any = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      queue.push(args);
    }
  };
  fbq.queue = queue;
  fbq.loaded = true;
  fbq.version = "2.0";

  window.fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params);
}

export function trackMetaCustomEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", eventName, params);
}
