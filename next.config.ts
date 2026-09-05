import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pre-launch validation campaign: paid traffic lands on the homepage only, so
  // sign-in and account creation are closed at the routing layer. The auth pages
  // and their code are untouched — delete this block to reopen them.
  async redirects() {
    return [
      { source: '/login', destination: '/', permanent: false },
      { source: '/register', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
