/**
 * Baza URL do Store API Medusy w `fetch()` i w JS SDK.
 *
 * W przeglądarce, gdy ustawione jest `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, wołamy
 * backend (np. Railway) **bez** proxy `/api/medusa`. Dzięki temu długie operacje
 * (`completeCart`, cold start) nie trafiają w limit czasu funkcji Vercela —
 * w przeciwnym razie platforma zwraca 504 z tekstem „Application failed to respond”.
 *
 * Bez zmiennej publicznej zostaje same-origin `/api/medusa` (wygodne w dev).
 * Na serwerze (RSC / Server Actions): zawsze bezpośredni URL z env.
 */
export function resolveMedusaFetchBase(): string {
  const pub = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim();

  if (typeof window !== "undefined") {
    if (pub) return pub.replace(/\/$/, "");
    return `${window.location.origin}/api/medusa`;
  }

  return (
    process.env.MEDUSA_BACKEND_URL?.trim() ||
    pub ||
    "http://localhost:9000"
  );
}
