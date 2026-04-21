import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const MEILISEARCH_HOST =
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700";

/**
 * Sentry w przeglądarce wyśle requesty do `*.ingest.sentry.io` (lub do
 * Twojej subdomeny samodzielnej instancji). Dodajemy je do `connect-src`
 * tylko, kiedy publiczny DSN jest skonfigurowany — w dev bez Sentry
 * zostawiamy CSP jak najciaśniejsze.
 */
const SENTRY_CSP_HOSTS = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? " https://*.ingest.sentry.io https://*.sentry.io"
  : "";

const medusaUrl = new URL(MEDUSA_BACKEND_URL);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: medusaUrl.protocol.replace(":", "") as "http" | "https",
        hostname: medusaUrl.hostname,
        port: medusaUrl.port || undefined,
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/produkty",
        destination: "/sklep",
        permanent: true,
      },
      {
        source: "/produkty/:path*",
        destination: "/sklep/gotowe-wzory/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://eu.posthog.com https://eu.i.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://cdn.sanity.io https://www.facebook.com https://images.unsplash.com " + MEDUSA_BACKEND_URL,
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://eu.posthog.com https://eu.i.posthog.com https://connect.facebook.net https://api.mailerlite.com " + MEDUSA_BACKEND_URL + " " + MEILISEARCH_HOST + SENTRY_CSP_HOSTS,
              "frame-src 'self' https://www.facebook.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    /**
     * Tree-shakuje „mega" pakiety, z których importujemy pojedyncze symbole.
     * Głównie lucide-react (~200 ikon), ale też radix i posthog — bez tego
     * cały barrel trafiał do client bundle.
     */
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-icons",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "posthog-js",
      "posthog-js/react",
    ],
  },
};

/**
 * Sentry wrap. Gdy nie ma SENTRY_AUTH_TOKEN + organizacji + projektu,
 * `withSentryConfig` nie uploaduje sourcemap — ale samo obudowanie jest
 * niegroźne, a pozwala mieć jeden entrypoint. W dev bez DSN to de facto
 * no-op, bo `instrumentation.ts` też warunkuje na `SENTRY_DSN`.
 */
const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;

export default SENTRY_ORG && SENTRY_PROJECT
  ? withSentryConfig(nextConfig, {
      org: SENTRY_ORG,
      project: SENTRY_PROJECT,
      // Bez autoryzacji (auth token) Sentry i tak nic nie uploaduje,
      // więc w PR previews nie będzie szumu.
      authToken: process.env.SENTRY_AUTH_TOKEN,

      silent: !process.env.CI,

      // Ukrywamy sourcemapy klienta po uploadzie, żeby ich nie serwować
      // użytkownikom. Sentry dostaje pełne, przeglądarka nie ma do nich
      // dostępu.
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },

      disableLogger: true,
    })
  : nextConfig;
