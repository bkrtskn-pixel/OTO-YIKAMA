import type { MetadataRoute } from 'next';

/** PWA: panel "ana ekrana ekle" ile uygulama gibi açılır. Çevrimdışı veri yazma yok (docs/01 §3.1). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oto Yıkama Yönetim Paneli',
    short_name: 'Yıkama Panel',
    description: 'Araç kabul, müşteri ve kasa yönetimi',
    start_url: '/panel',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    lang: 'tr',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
