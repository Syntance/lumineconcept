import { draftMode } from "next/headers";
import { PreviewOverlay } from "./PreviewOverlay";

/**
 * Bramka RSC: overlay edycji na żywo trafia do drzewa WYŁĄCZNIE przy
 * włączonym draftMode (sesja admina, /api/cms-preview/enable). Odwiedzający
 * produkcję nie dostaje ani bajta edytorskiego JS.
 */
export async function PreviewOverlayGate() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  return <PreviewOverlay />;
}
