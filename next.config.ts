import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/newsletter",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
