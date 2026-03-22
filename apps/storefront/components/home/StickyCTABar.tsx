"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function StickyCTABar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const footerCta = document.getElementById("footer-cta");
    if (!footerCta) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(footerCta);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      <div className="bg-white/95 backdrop-blur-sm border-t border-brand-100 px-4 py-3">
        <Link
          href="/logo-3d"
          className="flex w-full items-center justify-center bg-brand-900 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-800"
        >
          Wyślij logo — wycena w 24h
        </Link>
      </div>
    </div>
  );
}
