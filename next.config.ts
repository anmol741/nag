import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nagsbeautysupply.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
    // Needed for the local /product-placeholder.svg fallback — scoped to
    // Next.js's documented-safe settings (no inline scripts, sandboxed).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/newsletter",
        permanent: true,
      },
      // /account is the single customer login/registration entry point —
      // these two standalone pages were redundant with it.
      {
        source: "/login",
        destination: "/account",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/account",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
