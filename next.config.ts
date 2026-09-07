import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
