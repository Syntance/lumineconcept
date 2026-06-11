"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { trackFormSubmit } from "@/lib/analytics/events";
import { useFormTracking } from "@/hooks/useFormTracking";
import { identifyLead } from "@/lib/analytics/identify";

type Status = "idle" | "loading" | "success" | "error";

const INPUT_CLASS =
  "w-full rounded-none border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent";

type Props = {
  /** Po udanym wysłaniu (np. zamknięcie calloutu). */
  onSuccess?: () => void;
  className?: string;
};

export function ContactFormMini({ onSuccess, className = "" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");
  const tracker = useFormTracking("kontakt");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    if (email.trim()) {
      identifyLead({ email, name, source: "form_kontakt" });
    }
    trackFormSubmit({ formName: "kontakt" });

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
      <div className={`flex flex-col items-center gap-2 py-2 text-center text-green-700 ${className}`}>
        <CheckCircle className="h-8 w-8" aria-hidden />
        <p className="text-sm font-medium">{feedback}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`relative space-y-3 ${className}`.trim()}>
      <p className="text-sm font-medium text-brand-800">Formularz kontaktowy</p>
      <input
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
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={tracker.handleFocus}
        onBlur={tracker.recordField("email")}
        maxLength={200}
        placeholder="E-mail"
        className={INPUT_CLASS}
      />
      <input
        name="phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onFocus={tracker.handleFocus}
        onBlur={tracker.recordField("phone")}
        maxLength={40}
        placeholder="Telefon (opcjonalnie)"
        className={INPUT_CLASS}
      />
      <textarea
        name="message"
        required
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={tracker.handleFocus}
        onBlur={tracker.recordField("message")}
        maxLength={4000}
        placeholder="Wiadomość"
        className={`${INPUT_CLASS} min-h-[5rem] resize-y`}
      />
      <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden>
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      {status === "error" ? (
        <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{feedback}</span>
        </div>
      ) : null}
      <p className="text-xs leading-snug text-brand-600">
        Wysyłając formularz akceptujesz{" "}
        <Link
          href="/polityka-prywatnosci"
          className="font-medium underline underline-offset-2 hover:text-brand-900"
        >
          politykę prywatności
        </Link>
        .
      </p>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-none bg-brand-800 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand-900 disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label="Wysyłanie" />
        ) : (
          "Wyślij"
        )}
      </button>
    </form>
  );
}
