import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { getPublicSite, safeBrandColor } from '@/lib/site';
import './globals.css';

// Marka rengi ve işletme bilgisi veritabanından gelir; build anında sabitlenmemeli.
// (Faz 15'te site sayfaları için ISR/önbellek stratejisi kurulacak.)
export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSite();
  const name = site.ok ? site.data.businessName : 'Oto Yıkama';
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: name, template: `%s | ${name}` },
    description: site.ok ? (site.data.slogan ?? undefined) : undefined,
    applicationName: name,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const site = await getPublicSite();
  const brand = safeBrandColor(site.ok ? site.data.primaryColor : null);

  return (
    <html lang="tr" className={inter.variable} style={{ '--brand': brand } as CSSProperties}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
