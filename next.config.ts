import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-dialog',
    ],
  },
  images: {
    formats: [
      'image/avif',
      'image/webp',
    ],
    minimumCacheTTL: 60,
  },
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: false
  }
};

export default nextConfig;
