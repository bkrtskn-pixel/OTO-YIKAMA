import path from 'node:path';
import type { NextConfig } from 'next';

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo: standalone çıktısı workspace paketlerini de içersin
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  // ESLint depo kökünde tek yapılandırmayla çalışır (pnpm lint); build tekrar etmesin.
  eslint: { ignoreDuringBuilds: true },
  // GitHub Codespaces önizleme adreslerinden geliştirme sunucusuna erişim
  allowedDevOrigins: ['*.app.github.dev'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // Geliştirmede tarayıcının /api isteklerini NestJS'e yönlendir.
  // Production'da bu işi Nginx yapar (aynı origin → cookie ve CSRF basit kalır).
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_INTERNAL_URL}/api/:path*` }];
  },
};

export default nextConfig;
