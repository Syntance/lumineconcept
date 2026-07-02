"use client";

import { TrackedOutboundLink } from "@/components/analytics/TrackedOutboundLink";
import type { SocialLinks } from "@/lib/content/types";

type Props = {
  social: SocialLinks;
  className?: string;
};

export function FooterSocialLinks({ social, className }: Props) {
  const linkClass =
    className ?? "text-on-brand-800 hover:text-white transition-colors";

  return (
    <ul className="mt-4 flex flex-wrap gap-3 text-sm">
      {social.instagram ? (
        <li>
          <TrackedOutboundLink
            href={social.instagram}
            cta_label="Instagram"
            className={linkClass}
          >
            Instagram
          </TrackedOutboundLink>
        </li>
      ) : null}
      {social.facebook ? (
        <li>
          <TrackedOutboundLink
            href={social.facebook}
            cta_label="Facebook"
            className={linkClass}
          >
            Facebook
          </TrackedOutboundLink>
        </li>
      ) : null}
      {social.tiktok ? (
        <li>
          <TrackedOutboundLink
            href={social.tiktok}
            cta_label="TikTok"
            className={linkClass}
          >
            TikTok
          </TrackedOutboundLink>
        </li>
      ) : null}
    </ul>
  );
}

export function FooterCreditLink() {
  return (
    <TrackedOutboundLink
      href="https://syntance.com"
      cta_label="Syntance"
      className="text-on-brand-800 underline underline-offset-2 hover:text-white"
    >
      Syntance
    </TrackedOutboundLink>
  );
}
