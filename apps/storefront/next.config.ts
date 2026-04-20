import type { NextConfig } from "next";

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
const MEILISEARCH_HOST =
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST ?? "http://localhost:7700";

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
              "connect-src 'self' https://eu.posthog.com https://eu.i.posthog.com https://connect.facebook.net https://api.mailerlite.com " + MEDUSA_BACKEND_URL + " " + MEILISEARCH_HOST,
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
  },
};

export default nextConfig;
