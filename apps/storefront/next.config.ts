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

/**
 * Publiczne hosty R2 / CDN — muszą być dostępne przy buildzie (Vercel ENV).
 * S3_FILE_URL (server) + NEXT_PUBLIC_S3_FILE_URL (fallback dla next/image w CI).
 */
function collectMediaCdnOrigins(): string[] {
	const origins = new Set<string>();
	for (const raw of [process.env.S3_FILE_URL, process.env.NEXT_PUBLIC_S3_FILE_URL]) {
		if (!raw?.trim()) continue;
		try {
			origins.add(new URL(raw.trim()).origin);
		} catch {
			/* skip invalid */
		}
	}
	return [...origins];
}

const medusaUrl = new URL(MEDUSA_BACKEND_URL);
const mediaCdnOrigins = collectMediaCdnOrigins();
const r2CspOrigin = mediaCdnOrigins.length > 0 ? ` ${mediaCdnOrigins.join(" ")}` : "";
const r2RemotePatterns = mediaCdnOrigins.map((origin) => {
	const u = new URL(origin);
	return {
		protocol: u.protocol.replace(":", "") as "http" | "https",
		hostname: u.hostname,
		port: u.port || undefined,
	};
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      /**
       * Istniejące produkty w Medusie mogą nadal wskazywać na URL-e z
       * historycznego uploadu przez Cloudinary — next/image wymaga jawnego hosta.
       * Nowe pliki idą na backend (`static/`); po migracji zdjęć można tu usunąć.
       */
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
      ...(r2RemotePatterns.length > 0 ? r2RemotePatterns : []),
      {
        protocol: "https",
        hostname: "**.r2.dev",
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
      /**
       * Stary URL `/logo-3d` — przekierowanie do strony „Tablice z logo” (`/sklep/logo-3d`).
       */
      {
        source: "/logo-3d",
        destination: "/sklep/logo-3d",
        permanent: true,
      },
      {
        source: "/realizacje",
        destination: "/sklep",
        permanent: true,
      },
      {
        source: "/realizacje/:path*",
        destination: "/sklep",
        permanent: true,
      },
      /** Konto klienta — nieużywane; stare linki i zakładki na `/konto`. */
      {
        source: "/konto",
        destination: "/",
        permanent: true,
      },
      {
        source: "/konto/:path*",
        destination: "/",
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://eu.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://cdn.sanity.io https://www.facebook.com https://images.unsplash.com " + MEDUSA_BACKEND_URL + r2CspOrigin,
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://eu.posthog.com https://eu.i.posthog.com https://eu-assets.i.posthog.com https://connect.facebook.net https://api.mailerlite.com https://challenges.cloudflare.com " + MEDUSA_BACKEND_URL + " " + MEILISEARCH_HOST + SENTRY_CSP_HOSTS,
              "frame-src 'self' https://www.facebook.com https://challenges.cloudflare.com",
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
      bodySizeLimit: "100mb",
    },
    /** Route Handlers (`/api/upload` — pliki klientów w koszyku). */
    proxyClientMaxBodySize: "100mb",
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
