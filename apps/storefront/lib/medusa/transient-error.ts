import { FetchError } from "@medusajs/js-sdk";

/** 502/503/504, Railway „Application failed to respond”, itd. */
export function isTransientMedusaError(e: unknown): boolean {
  if (e instanceof FetchError) {
    const s = e.status;
    return s === 502 || s === 503 || s === 504;
  }
  if (e instanceof Error) {
    return /Application failed to respond|502|503|504|Bad Gateway|Service Unavailable|Gateway Timeout/i.test(
      e.message,
    );
  }
  return false;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
