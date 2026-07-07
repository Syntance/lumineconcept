import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/** Wyłącza tryb „edycji na żywo" CMS i wraca na wskazaną ścieżkę. */
export async function GET(req: NextRequest) {
  const rawPath = req.nextUrl.searchParams.get("path") ?? "/";
  const path =
    rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";

  (await draftMode()).disable();
  return NextResponse.redirect(new URL(path, req.nextUrl.origin));
}
