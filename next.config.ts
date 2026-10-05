import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy (no nonces — see the Next.js CSP guide in
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// Nonces would force every page to render dynamically and lose static/CDN
// caching, so this uses the documented "without nonces" policy:
// - scripts: this origin only (+ inline, which Next.js's own hydration
//   bootstrap needs without nonces; + eval in dev only, for React tooling)
// - images: this origin, data/blob, and https — WooCommerce product
//   descriptions (sanitized server-side) can embed images from WordPress/CDNs
// - everything else (fetch, fonts, media, frames, forms) locked to this origin
// No third-party scripts are loaded by this frontend.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

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
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          // HTTPS confirmed on the Netlify deployment (Netlify also sends its
          // own HSTS header). Production only — never on http://localhost.
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
        ],
      },
      {
        // Per-visitor API responses must never be cached by a CDN or browser.
        source: "/api/:group(auth|account|checkout|courses)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
