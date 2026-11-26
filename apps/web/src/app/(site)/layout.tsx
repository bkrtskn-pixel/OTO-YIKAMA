import Link from 'next/link';
import type { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { getPublicSite, whatsappLink } from '@/lib/site';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const site = await getPublicSite();
  const name = site.ok ? site.data.businessName : 'Oto Yıkama';
  const wa = site.ok ? whatsappLink(site.data.whatsappPhone) : null;
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="min-w-0 text-slate-900">
            <BrandMark name={name} />
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {year} {name}
          </p>
          {site.ok && site.data.phone && (
            <a href={`tel:${site.data.phone.replace(/\s/g, '')}`} className="hover:text-slate-900">
              {site.data.phone}
            </a>
          )}
        </div>
      </footer>

      {/* WhatsApp iletişim butonu — sadece numara tanımlıysa gösterilir */}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp ile yazın"
          className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
        >
          <MessageCircle className="size-7" aria-hidden />
        </a>
      )}
    </div>
  );
}
