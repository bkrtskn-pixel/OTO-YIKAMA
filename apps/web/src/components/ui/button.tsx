import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const variants = {
  primary: 'bg-brand text-brand-foreground hover:bg-brand-strong shadow-sm',
  secondary: 'bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1ebe5b] shadow-sm',
} as const;

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  // Mobil dokunmatik hedef: en az 44px
  lg: 'h-12 px-5 text-base',
} as const;

type Common = { variant?: keyof typeof variants; size?: keyof typeof sizes };

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return <button type={type} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Common & { href: string }) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (/^https?:\/\//.test(href)) {
    return <a href={href} className={cls} rel="noopener noreferrer" target="_blank" {...props} />;
  }
  return <Link href={href} className={cls} {...props} />;
}
