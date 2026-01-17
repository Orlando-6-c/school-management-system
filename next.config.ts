import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
