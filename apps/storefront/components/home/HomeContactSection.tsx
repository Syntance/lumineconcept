"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { trackFormStart, trackFormSubmit } from "@/lib/analytics/events";

type Status = "idle" | "loading" | "success" | "error";

/** Ten sam układ co `BestsellersSection`: biały pas → sygnet na linii z kremem. */
function ContactSectionSignetBlock() {
  return (
    <div className="bg-white pt-4 pb-0 md:pt-5">
      <div className="container mx-auto flex justify-center px-4">
        <div className="mx-auto flex w-full max-w-68 justify-center">
          <div className="relative aspect-421/396 w-[42%] min-w-15.75 max-w-30">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 bottom-0 z-0 w-screen -translate-x-1/2 bg-brand-50"
              aria-hidden
            />
            <Image
              src="/images/lumine-signet-brown.png"
              alt="Sygnet Lumine Concept"
              fill
              className="relative z-10 object-contain object-center"
              sizes="120px"
              priority={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    trackFormSubmit("home_contact");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message,
          website: honeypot,
        }),
      });

      const data = (await response.json()) as { success: boolean; message: string };

      if (data.success) {
        setStatus("success");
        setFeedback(data.message);
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        setStatus("error");
        setFeedback(data.message);
      }
    } catch {
      setStatus("error");
      setFeedback("Wystąpił błąd sieci. Spróbuj ponownie.");
    }
  };

  if (status === "success") {
    return (
      <section id="kontakt" aria-label="Formularz kontaktowy — wysłano wiadomość">
        <ContactSectionSignetBlock />
        <div className="bg-brand-50 pt-3 pb-16 md:pt-4 lg:pt-4 lg:pb-20">
          <div className="container mx-auto max-w-xl px-4 text-center">
            <div className="mb-10 text-center lg:mb-12">
              <h2 className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl">
                Napisz do nas
              </h2>
              <div className="mx-auto mt-3 h-px w-12 bg-accent" />
            </div>
            <div className="flex flex-col items-center gap-3 text-green-700">
              <CheckCircle className="h-10 w-10" aria-hidden />
              <p className="text-base font-medium">{feedback}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="kontakt" aria-labelledby="home-contact-heading">
      <ContactSectionSignetBlock />

      <div className="bg-brand-50 pt-3 pb-16 md:pt-4 lg:pt-4 lg:pb-20">
        <div className="container mx-auto max-w-xl px-4">
          <div className="mb-10 text-center lg:mb-12">
            <h2
              id="home-contact-heading"
              className="font-display text-3xl tracking-widest text-brand-800 lg:text-4xl"
            >
              Napisz do nas
            </h2>
            <div className="mx-auto mt-3 h-px w-12 bg-accent" />
          </div>

          <p className="text-center text-base text-brand-600">
            Pytania o produkty, wycena lub współpraca — odezwiemy się e-mailem. Możesz też napisać bezpośrednio na{" "}
            <a
              href="mailto:kontakt@lumineconcept.pl"
              className="font-medium text-brand-800 underline-offset-2 hover:underline"
            >
              kontakt@lumineconcept.pl
            </a>
            .
          </p>

          <form onSubmit={handleSubmit} className="relative mt-10 grid gap-5">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-name" className="text-sm font-medium text-brand-800">
                Imię lub nazwa
              </label>
              <input
                id="contact-name"
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => trackFormStart("home_contact")}
                maxLength={120}
                className="rounded-none border border-brand-200 bg-white px-4 py-2.5 text-brand-900 outline-none transition-colors placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="text-sm font-medium text-brand-800">
                E-mail
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                className="rounded-none border border-brand-200 bg-white px-4 py-2.5 text-brand-900 outline-none transition-colors placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-phone" className="text-sm font-medium text-brand-800">
              Telefon <span className="font-normal text-brand-500">(opcjonalnie)</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              className="rounded-none border border-brand-200 bg-white px-4 py-2.5 text-brand-900 outline-none transition-colors placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-message" className="text-sm font-medium text-brand-800">
              Wiadomość
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              className="resize-y rounded-none border border-brand-200 bg-white px-4 py-2.5 text-brand-900 outline-none transition-colors placeholder:text-brand-400 focus:border-accent focus:ring-1 focus:ring-accent min-h-[8rem]"
            />
          </div>

          {/* Honeypot — ukryte przed ludźmi */}
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <p className="min-w-0 flex-1 text-center text-sm leading-snug text-brand-600 sm:text-left">
              Wysyłając formularz akceptujesz{" "}
              <Link href="/polityka-prywatnosci" className="font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900">
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
        </div>
      </div>
    </section>
  );
}
