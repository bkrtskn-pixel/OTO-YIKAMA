'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { cn } from '@/lib/cn';
import { PANEL_NAV } from './nav';

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-6" aria-label="Panel menüsü">
      {PANEL_NAV.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-1">
          {group.label && (
            <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.href === '/panel' ? pathname === '/panel' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function PanelShell({ businessName, children }: { businessName: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Sayfa değişince mobil menüyü kapat
  useEffect(() => setOpen(false), [pathname]);

  // Mobil menü açıkken arka plan kaymasın, Esc ile kapansın
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="min-h-dvh lg:pl-72">
      {/* Masaüstü sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-slate-900 px-4 py-5 lg:flex">
        <Link href="/panel" className="mb-8 px-2 text-white">
          <BrandMark name={businessName} inverted />
        </Link>
        <NavLinks />
        <p className="mt-auto px-3 text-xs text-slate-500">Yönetim paneli · v0.1</p>
      </aside>

      {/* Mobil üst çubuk */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-2 grid size-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Menüyü aç"
          aria-expanded={open}
          aria-controls="mobil-menu"
        >
          <Menu className="size-6" />
        </button>
        <Link href="/panel" className="min-w-0 text-slate-900">
          <BrandMark name={businessName} />
        </Link>
      </header>

      {/* Mobil çekmece menü */}
      <div
        className={cn('fixed inset-0 z-40 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
        aria-hidden={!open}
      >
        <div
          className={cn('absolute inset-0 bg-slate-900/50 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
          onClick={() => setOpen(false)}
        />
        <aside
          id="mobil-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Panel menüsü"
          className={cn(
            'pb-safe absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-slate-900 px-4 py-5 shadow-xl transition-transform',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="mb-8 flex items-center justify-between gap-2 px-2 text-white">
            <BrandMark name={businessName} inverted />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-11 place-items-center rounded-lg text-slate-300 hover:bg-white/10"
              aria-label="Menüyü kapat"
            >
              <X className="size-6" />
            </button>
          </div>
          <NavLinks onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
