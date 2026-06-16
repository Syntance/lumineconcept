"use client";

import type { ReactNode } from "react";
import { isExternalUrl } from "@/lib/analytics/is-external-url";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

type TrackedCtaProps = {
  href: string;
  cta_label: string;
  position: string;
  contact?: boolean;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
};

export function TrackedCta({
  href,
  cta_label,
  position,
  contact = false,
  className,
  children,
  target,
  rel,
}: TrackedCtaProps) {
  const { track } = useAnalytics();

  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => {
        if (isExternalUrl(href)) {
          track("outbound_click", {
            cta_label,
            target_url: href,
          });
          return;
        }
        if (contact) {
          track("contact_click", {
            cta_label,
            target_url: href,
          });
        } else {
          track("cta_click", {
            cta_label,
            position,
            target_url: href,
          });
        }
      }}
    >
      {children}
    </a>
  );
}
