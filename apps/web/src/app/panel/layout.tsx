import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PanelShell } from '@/components/panel/panel-shell';
import { getPublicSite } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Yönetim paneli',
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const site = await getPublicSite();
  return <PanelShell businessName={site.ok ? site.data.businessName : 'Yönetim paneli'}>{children}</PanelShell>;
}
