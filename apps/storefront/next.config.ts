import type { NextConfig } from "next";

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

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
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/medusa/:path*",
        destination: `${MEDUSA_BACKEND_URL}/:path*`,
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
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://eu.posthog.com https://cdn.cookieyes.com https://geowidget.inpost.pl",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://geowidget.inpost.pl",
              "img-src 'self' data: blob: https://res.cloudinary.com https://cdn.sanity.io https://www.facebook.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://eu.posthog.com https://connect.facebook.net https://api.mailerlite.com " + MEDUSA_BACKEND_URL,
              "frame-src 'self' https://geowidget.inpost.pl https://www.facebook.com",
            ].join("; "),
          },
        ],
      },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
