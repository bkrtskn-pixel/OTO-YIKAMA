import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Panel ve kişiye özel token sayfaları asla indekslenmez
        disallow: ['/panel', '/takip/', '/anket/', '/abonelik/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
