"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const REFERRAL_KEY = "lumine_referral_code";

export function ReferralBanner() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      localStorage.setItem(REFERRAL_KEY, refParam);
      setCode(refParam);
      return;
    }
    const saved = localStorage.getItem(REFERRAL_KEY);
    if (saved) setCode(saved);
  }, [searchParams]);

  if (!code || dismissed) return null;

  return (
    <div className="bg-accent text-white">
      <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-2">
        <p className="text-xs tracking-wide">
          <span className="font-semibold">-10%</span> z kodem od znajomej! Kod{" "}
          <span className="font-mono font-bold">{code}</span> zastosowany automatycznie.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Zamknij"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
