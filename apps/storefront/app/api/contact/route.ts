import { NextRequest, NextResponse } from "next/server";
import { getResendConfig } from "@/lib/resend/config";
import {
	createContactCaseNumber,
	sendContactConfirmationEmail,
	sendContactNotificationEmail,
	type ContactFormPreset,
} from "@magazyn/modules/emails";

export const maxDuration = 30;

const LIMITS = { name: 120, phone: 40, message: 4000 } as const;

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

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

function safeAttachmentFilename(name: string): string {
  const base = name.trim().replace(/^.*[/\\]/, "").slice(0, 200);
  return base || "zalacznik";
}

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0 || i === filename.length - 1) return "";
  return filename.slice(i + 1).toLowerCase();
}

function parseFormPreset(raw: string | undefined | null): ContactFormPreset {
  const v = String(raw ?? "").trim().toLowerCase();
  return v === "logo3d" ? "logo3d" : "contact";
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

async function ensureResendConfigured(): Promise<NextResponse | null> {
  const { apiKey, configured } = getResendConfig();
  if (!configured || !apiKey) {
    console.error("[api/contact] Brak RESEND_API_KEY");
    return NextResponse.json(
      {
        success: false,
        message: "Formularz jest chwilowo niedostępny. Napisz na kontakt@lumineconcept.pl.",
      },
      { status: 503 },
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const resendErr = await ensureResendConfigured();
    if (resendErr) return resendErr;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      if (String(formData.get("website") ?? "").trim()) {
        return NextResponse.json({ success: true, message: "Dziękujemy za wiadomość." });
      }

      const preset = parseFormPreset(String(formData.get("form_preset") ?? ""));
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim().toLowerCase();
      const phone = String(formData.get("phone") ?? "").trim();
      const message = String(formData.get("message") ?? "").trim();

      const err = validateCommon(name, email, phone, message);
      if (err) return err;

      const raw = formData.get("attachment");
      let attachment: { filename: string; contentBase64: string } | undefined;
      let attachmentFilename: string | undefined;

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
        attachmentFilename = filename;
      }

      const caseNumber = createContactCaseNumber();
      const payload = {
        name,
        email,
        phone,
        message,
        attachmentFilename,
      };

      const notification = await sendContactNotificationEmail(
        payload,
        caseNumber,
        preset,
        attachment,
      );
      if (!notification.ok) {
        return NextResponse.json(
          { success: false, message: notification.message },
          { status: 502 },
        );
      }

      const confirmation = await sendContactConfirmationEmail(payload, caseNumber, preset);
      if (!confirmation.ok) {
        return NextResponse.json(
          { success: false, message: confirmation.message },
          { status: 502 },
        );
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
      form_preset?: string;
    };

    if (body.website) {
      return NextResponse.json({ success: true, message: "Dziękujemy za wiadomość." });
    }

    const preset = parseFormPreset(body.form_preset);
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();

    const jsonErr = validateCommon(name, email, phone, message);
    if (jsonErr) return jsonErr;

    const caseNumber = createContactCaseNumber();
    const payload = { name, email, phone, message };

    const notification = await sendContactNotificationEmail(payload, caseNumber, preset);
    if (!notification.ok) {
      return NextResponse.json(
        { success: false, message: notification.message },
        { status: 502 },
      );
    }

    const confirmation = await sendContactConfirmationEmail(payload, caseNumber, preset);
    if (!confirmation.ok) {
      return NextResponse.json(
        { success: false, message: confirmation.message },
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
