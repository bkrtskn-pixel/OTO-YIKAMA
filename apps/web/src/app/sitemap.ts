import type { MetadataRoute } from 'next';

/** Faz 15'te tüm site sayfaları eklenecek. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [{ url: `${base}/`, changeFrequency: 'weekly', priority: 1 }];
}
