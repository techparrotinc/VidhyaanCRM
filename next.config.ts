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
  },
  async redirects() {
    return [
      {
        source: "/products/marketplace/track-application",
        destination: "/products/parent-portal",
        permanent: true,
      },
      // Legacy legal-page paths (old footer links, external references)
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-of-service", permanent: true },
      { source: "/refunds", destination: "/terms-of-service", permanent: true },
    ];
  }
};

export default nextConfig;
