"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { trackNewsletterSignup, trackFormStart, trackFormSubmit } from "@/lib/analytics/events";

interface NewsletterFormProps {
  variant?: "default" | "footer";
}

export function NewsletterForm({ variant = "default" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    trackFormSubmit("newsletter");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { success: boolean; message: string };

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        trackNewsletterSignup(email);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message);
      }
    } catch {
      setStatus("error");
      setMessage("Wystąpił błąd. Spróbuj ponownie.");
    }
  };

  const isFooter = variant === "footer";

  if (status === "success") {
    return (
      <div className={`flex items-center gap-2 ${isFooter ? "text-green-300" : "text-green-600"}`}>
        <CheckCircle className="h-5 w-5" />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onFocus={() => trackFormStart("newsletter")}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Twój adres email"
        className={`flex-1 rounded-md border px-4 py-2.5 text-sm outline-none transition-colors ${
          isFooter
            ? "border-brand-700 bg-brand-800 text-white placeholder:text-brand-400 focus:border-accent"
            : "border-brand-200 bg-white text-brand-900 placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent"
        }`}
        aria-label="Adres email do newslettera"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark transition-colors disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        ) : (
          "Zapisz się"
        )}
      </button>
      {status === "error" && (
        <div className="flex items-center gap-1 text-red-500 sm:col-span-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">{message}</span>
        </div>
      )}
    </form>
  );
}
