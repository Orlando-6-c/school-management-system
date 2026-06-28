import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
    typescript: { ignoreBuildErrors: true },
    eslint: { ignoreDuringBuilds: true },
    serverExternalPackages: ['@react-pdf/renderer'],
    compress: true,
    experimental: {
        optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    },
};

export default withSentryConfig(nextConfig, {
    silent: true,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
});
