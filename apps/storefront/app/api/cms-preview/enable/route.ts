import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionToken } from "@magazyn/core/medusa/session";

/**
 * Włącza tryb „edycji na żywo" CMS (Next draftMode) i przekierowuje na
 * wskazaną stronę. WYŁĄCZNIE dla zalogowanego admina magazynu — cookie
 * draftMode odblokowuje adnotacje `data-cms`, overlay edytorski i świeży
 * (bez cache) odczyt treści.
 *
 * Użycie: iframe strony podglądu w panelu ładuje
 *   /api/cms-preview/enable?path=/o-nas
 */
export async function GET(req: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { message: "Wymagane zalogowanie do panelu magazynu." },
      { status: 401 },
    );
  }

  const rawPath = req.nextUrl.searchParams.get("path") ?? "/";
  // Wyłącznie ścieżki wewnętrzne — bez open-redirectów i schematów.
  const path =
    rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, req.nextUrl.origin));
}
