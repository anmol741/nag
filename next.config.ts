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
      // /account shows login (or the dashboard, if already signed in);
      // /account/register is the dedicated registration page (Phase 2).
      {
        source: "/login",
        destination: "/account",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/account/register",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Baseline hardening headers, site-wide. No CSP here — this store
        // embeds several third-party scripts/fonts (Google Fonts, Elementor
        // widgets, etc. on the live WordPress site, and this frontend adds
        // its own) and getting a CSP right without breaking one of them
        // needs a dedicated pass this phase didn't scope; see the Phase 2
        // report.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
