import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error - eslint config is valid but missing in types
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
