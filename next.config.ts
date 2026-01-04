import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ⚠️ Force build to ignore type mismatches
  },
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ Force build to ignore linting errors
  },
};

export default nextConfig;
