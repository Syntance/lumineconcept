"use client";

import type { ReactNode } from "react";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

type TrackedOutboundLinkProps = {
  href: string;
  cta_label?: string;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

export function TrackedOutboundLink({
  href,
  cta_label,
  className,
  children,
  target = "_blank",
  rel = "noopener noreferrer",
  "aria-label": ariaLabel,
}: TrackedOutboundLinkProps) {
  const { track } = useAnalytics();

  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      onClick={() => {
        track("outbound_click", {
          target_url: href,
          ...(cta_label ? { cta_label } : {}),
        });
      }}
    >
      {children}
    </a>
  );
}
