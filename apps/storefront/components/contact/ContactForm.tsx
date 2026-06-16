"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAnalytics } from "@/lib/analytics/useAnalytics";
import { useFormTracking } from "@/hooks/useFormTracking";

type Status = "idle" | "loading" | "success" | "error";

const INPUT_CLASS =
  "rounded-none border border-brand-200 bg-white px-4 py-2.5 text-left text-brand-900 outline-none transition-colors placeholder:text-brand-700 placeholder:text-sm focus:border-accent focus:ring-1 focus:ring-accent";

type ContactFormProps = {
  className?: string;
  onSuccess?: () => void;
};

export function ContactForm({ className = "", onSuccess }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  const tracker = useFormTracking("kontakt");
  const { track, identifyLead } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    if (email.trim()) {
      identifyLead({ email, name, source: "form_kontakt" });
    }
    track("lead_submit", { form_name: "kontakt" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message,
          form_preset: "contact",
          website: honeypot,
        }),
      });

      const data = (await response.json()) as { success: boolean; message: string };

      if (data.success) {
        setStatus("success");
        setFeedback(data.message);
        tracker.handleSubmitSuccess();
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        onSuccess?.();
      } else {
        setStatus("error");
        setFeedback(data.message);
        tracker.reportError("form", "server");
      }
    } catch {
      setStatus("error");
      setFeedback("Wystąpił błąd sieci. Spróbuj ponownie.");
      tracker.reportError("form", "server");
    }
  };

  if (status === "success") {
    return (
      <div className={`flex flex-col items-center gap-3 py-6 text-center text-green-700 ${className}`.trim()}>
        <CheckCircle className="h-10 w-10" aria-hidden />
        <p className="text-base font-medium">{feedback}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`relative grid gap-5 ${className}`.trim()}>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-name" className="sr-only">Imię i nazwisko</label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={tracker.handleFocus}
            onBlur={tracker.recordField("name")}
            maxLength={120}
            placeholder="Imię i nazwisko"
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className="sr-only">E-mail</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onFocus={tracker.handleFocus}
            onBlur={() => {
              tracker.recordField("email")();
            }}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            placeholder="E-mail"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-phone" className="sr-only">Telefon (opcjonalnie)</label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onFocus={tracker.handleFocus}
          onBlur={tracker.recordField("phone")}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={40}
          placeholder="Telefon (opcjonalnie)"
          className={INPUT_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className="sr-only">Wiadomość</label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          value={message}
          onFocus={tracker.handleFocus}
          onBlur={tracker.recordField("message")}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          placeholder="Wiadomość"
          className={`${INPUT_CLASS} min-h-[8rem] resize-y`}
        />
      </div>

      <div className="pointer-events-none absolute top-0 left-0 h-px w-px overflow-hidden opacity-0" aria-hidden>
        <label htmlFor="contact-website">Strona www</label>
        <input
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {status === "error" && (
        <div className="flex items-start gap-2 rounded-none border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex flex-col items-start gap-4">
        <p className="max-w-prose text-left text-sm leading-snug text-brand-600">
          Wysyłając formularz akceptujesz{" "}
          <Link
            href="/polityka-prywatnosci"
            className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900"
          >
            politykę prywatności
          </Link>
          .
        </p>
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex shrink-0 items-center justify-center rounded-none bg-brand-800 px-6 py-2.5 text-sm font-semibold uppercase leading-none tracking-[0.15em] text-white transition-colors hover:bg-brand-900 disabled:opacity-50"
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-label="Wysyłanie" />
          ) : (
            "Wyślij"
          )}
        </button>
      </div>
    </form>
  );
}
