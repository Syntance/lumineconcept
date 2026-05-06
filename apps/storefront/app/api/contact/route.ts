import { NextRequest, NextResponse } from "next/server";

const LIMITS = { name: 120, phone: 40, message: 4000 } as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
      /** Honeypot — wypełnione = bot */
      website?: string;
    };

    if (body.website) {
      return NextResponse.json({ success: true, message: "Dziękujemy za wiadomość." });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    let message = String(body.message ?? "").trim();

    if (!name || name.length > LIMITS.name) {
      return NextResponse.json(
        { success: false, message: "Podaj imię lub nazwę (do 120 znaków)." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Podaj prawidłowy adres e-mail." },
        { status: 400 },
      );
    }

    if (phone.length > LIMITS.phone) {
      return NextResponse.json(
        { success: false, message: "Numer telefonu jest za długi." },
        { status: 400 },
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { success: false, message: "Wiadomość niech ma co najmniej 10 znaków." },
        { status: 400 },
      );
    }
    if (message.length > LIMITS.message) {
      return NextResponse.json(
        { success: false, message: "Wiadomość jest za długa." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM?.trim();
    const to = process.env.CONTACT_INBOX_EMAIL?.trim() ?? "kontakt@lumineconcept.pl";

    if (!apiKey || !from) {
      console.error("[api/contact] Brak RESEND_API_KEY lub RESEND_FROM");
      return NextResponse.json(
        {
          success: false,
          message: "Formularz jest chwilowo niedostępny. Napisz na kontakt@lumineconcept.pl.",
        },
        { status: 503 },
      );
    }

    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      phone: phone ? escapeHtml(phone) : "",
      message: escapeHtml(message),
    };

    const html = `
      <p><strong>Nadawca:</strong> ${safe.name}</p>
      <p><strong>E-mail:</strong> <a href="mailto:${safe.email}">${safe.email}</a></p>
      ${safe.phone ? `<p><strong>Telefon:</strong> ${safe.phone}</p>` : ""}
      <hr />
      <p style="white-space:pre-wrap">${safe.message.replace(/\n/g, "<br/>")}</p>
    `;

    const text = [
      `Nadawca: ${name}`,
      `E-mail: ${email}`,
      phone ? `Telefon: ${phone}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Lumine — wiadomość od ${name}`,
        html,
        text,
      }),
    });

    if (!resendRes.ok) {
      const errBody = (await resendRes.json().catch(() => null)) as { message?: string } | null;
      console.error("[api/contact] Resend:", resendRes.status, errBody);
      return NextResponse.json(
        { success: false, message: "Nie udało się wysłać wiadomości. Spróbuj ponownie." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Dziękujemy — odezwiemy się możliwie szybko.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Wystąpił błąd. Spróbuj ponownie." },
      { status: 500 },
    );
  }
}
