import { NextResponse, type NextRequest } from "next/server";
import { subscribeToNewsletter } from "@/lib/mailerlite";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      last_name?: string;
    };

    if (!body.email || !body.email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Podaj prawidłowy adres email" },
        { status: 400 },
      );
    }

    const result = await subscribeToNewsletter(body.email, {
      name: body.name,
      last_name: body.last_name,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}
