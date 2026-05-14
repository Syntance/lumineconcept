/**
 * Segment biznesowy używany przez wszystkie eventy analityczne (Notion: "User flows i analityka").
 *
 * Konwencja:
 * - `beauty` — salony beauty (jedyny aktywny segment, scope MVP).
 * - `edu`    — edukatorki/instruktorki (zaplanowany, nieaktywny — patrz Notion strony segmentu).
 *
 * Zmienna środowiskowa pozwoli przełączyć w przyszłości bez ruszania kodu (np. dedykowana subdomena edu).
 */
export type AnalyticsSegment = "beauty" | "edu";

const RAW_SEGMENT = (process.env.NEXT_PUBLIC_ANALYTICS_SEGMENT ?? "beauty").toLowerCase();

export const ANALYTICS_SEGMENT: AnalyticsSegment =
  RAW_SEGMENT === "edu" ? "edu" : "beauty";
