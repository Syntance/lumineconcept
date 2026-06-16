/** Meta standard events dozwolone z przeglądarki przez /api/capi. */
export const BROWSER_CAPI_EVENTS = [
  "Lead",
  "Contact",
  "CompleteRegistration",
] as const;

export type BrowserCapiEventName = (typeof BROWSER_CAPI_EVENTS)[number];

const BROWSER_CAPI_SET = new Set<string>(BROWSER_CAPI_EVENTS);

export function isBrowserCapiEvent(
  eventName: string,
): eventName is BrowserCapiEventName {
  return BROWSER_CAPI_SET.has(eventName);
}
