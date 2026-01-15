import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Configuration Next.js optimisée

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Configuration des performances
  poweredByHeader: false,
  compress: true,
  
  // Optimisations des builds (à réactiver progressivement)
  typescript: {
    ignoreBuildErrors: true, // Temporaire
  },

  // Configuration images optimisée
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gvhhuosgnhjmwivavwfp.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24h
  },

  // Configuration expérimentale simplifiée
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dropdown-menu',
      'recharts',
    ],
  },

  // Modules externes pour les Server Components
  serverExternalPackages: ['@supabase/supabase-js', '@emnapi/core', '@tailwindcss/oxide', '@tailwindcss/oxide-wasm32-wasi'],

  // Headers de sécurité et performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Configuration webpack désactivée temporairement pour tester
  // webpack: (config, { dev }) => {
  //   return config;
  // },

  // Configuration de sortie optimisée
  ...(process.env.BUILD_STANDALONE === 'true' && {
    output: 'standalone',
  }),
  
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);