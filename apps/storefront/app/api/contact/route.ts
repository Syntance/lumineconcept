import { NextRequest, NextResponse } from "next/server";
import { getResendConfig } from "@/lib/resend/config";

export const maxDuration = 30;

const LIMITS = { name: 120, phone: 40, message: 4000 } as const;

/**
 * Twardy limit pliku załącznika. Resend przyjmuje ~40 MB po base64, ale
 * skrzynki odbiorcze (Gmail/Outlook) bywają restrykcyjne na 25 MB; do tego
 * Vercel ma limit body funkcji ok. 4,5 MB. 4 MB to bezpieczny próg dla
 * pojedynczego loga (SVG/PNG/PDF) i wystarczająco mało, by nie obciążać
 * funkcji ani Resend.
 */
const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

/** Rozszerzenia, których NIE przyjmujemy z formularza (niezależnie od MIME). */
const DISALLOWED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "scr",
  "sh",
  "ps1",
  "vbs",
  "jar",
  "js",
  "mjs",
  "html",
  "htm",
  "php",
  "py",
  "rb",
]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeAttachmentFilename(name: string): string {
  const base = name.trim().replace(/^.*[/\\]/, "").slice(0, 200);
  return base || "zalacznik";
}

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0 || i === filename.length - 1) return "";
  return filename.slice(i + 1).toLowerCase();
}

type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
  attachment?: { filename: string; contentBase64: string };
};

async function sendContactEmail(
  payload: ContactPayload,
): Promise<{ ok: true } | { ok: false; status: number; body: object }> {
  const { name, email, phone, message, attachment } = payload;

  const { apiKey, from, configured } = getResendConfig();
  const to = process.env.CONTACT_INBOX_EMAIL?.replace(/\r\n/g, "").trim() ?? "kontakt@lumineconcept.pl";

  if (!configured || !apiKey) {
    console.error("[api/contact] Brak RESEND_API_KEY");
    return {
      ok: false,
      status: 503,
      body: {
        success: false,
        message: "Formularz jest chwilowo niedostępny. Napisz na kontakt@lumineconcept.pl.",
      },
    };
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
      ${attachment ? `<p><strong>Załącznik:</strong> ${escapeHtml(attachment.filename)}</p>` : ""}
      <hr />
      <p style="white-space:pre-wrap">${safe.message.replace(/\n/g, "<br/>")}</p>
    `;

  const textLines = [
    `Nadawca: ${name}`,
    `E-mail: ${email}`,
    phone ? `Telefon: ${phone}` : null,
    attachment ? `Załącznik: ${attachment.filename}` : null,
    "",
    message,
  ].filter((line) => line !== null);

  const text = textLines.join("\n");

  const resendBody: Record<string, unknown> = {
    from,
    to: [to],
    reply_to: email,
    subject: `Lumine — wiadomość od ${name}`,
    html,
    text,
  };

  if (attachment) {
    resendBody.attachments = [
      {
        filename: attachment.filename,
        content: attachment.contentBase64,
      },
    ];
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resendBody),
  });

  if (!resendRes.ok) {
    const errBody = (await resendRes.json().catch(() => null)) as { message?: string } | null;
    console.error("[api/contact] Resend:", resendRes.status, errBody);
    return {
      ok: false,
      status: 502,
      body: {
        success: false,
        message: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
      },
    };
  }

  return { ok: true };
}

function validateCommon(name: string, email: string, phone: string, message: string): NextResponse | null {
  if (!name || name.length > LIMITS.name) {
    return NextResponse.json(
      { success: false, message: "Podaj imię i nazwisko (do 120 znaków)." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, message: "Podaj prawidłowy adres e-mail." }, { status: 400 });
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

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      if (String(formData.get("website") ?? "").trim()) {
        return NextResponse.json({ success: true, message: "Dziękujemy za wiadomość." });
      }

      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const phone = String(formData.get("phone") ?? "").trim();
      const message = String(formData.get("message") ?? "").trim();

      const err = validateCommon(name, email, phone, message);
      if (err) return err;

      const raw = formData.get("attachment");
      let attachment: ContactPayload["attachment"];

      if (raw instanceof File && raw.size > 0) {
        if (raw.size > MAX_ATTACHMENT_BYTES) {
          return NextResponse.json(
            {
              success: false,
              message: `Załącznik jest za duży (maks. ${Math.floor(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB). Większy plik prześlij mailem na kontakt@lumineconcept.pl.`,
            },
            { status: 400 },
          );
        }

        const filename = safeAttachmentFilename(raw.name);
        const ext = getExtension(filename);
        if (DISALLOWED_EXTENSIONS.has(ext)) {
          return NextResponse.json(
            { success: false, message: "Ten typ pliku nie jest dozwolony." },
            { status: 400 },
          );
        }

        const buf = Buffer.from(await raw.arrayBuffer());
        attachment = { filename, contentBase64: buf.toString("base64") };
      }

      const send = await sendContactEmail({ name, email, phone, message, attachment });
      if (!send.ok) {
        return NextResponse.json(send.body, { status: send.status });
      }

      return NextResponse.json({
        success: true,
        message: "Dziękujemy — odezwiemy się możliwie szybko.",
      });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
      website?: string;
    };

    if (body.website) {
      return NextResponse.json({ success: true, message: "Dziękujemy za wiadomość." });
    }

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();

    const jsonErr = validateCommon(name, email, phone, message);
    if (jsonErr) return jsonErr;

    const send = await sendContactEmail({ name, email, phone, message });
    if (!send.ok) {
      return NextResponse.json(send.body, { status: send.status });
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
