import { Activity, LayoutDashboard, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * Panel menüsü. KURAL: Bir modül çalışır hâle gelmeden menüye eklenmez
 * (çalışmayan buton/ekran yok). Her faz kendi menü öğesini ekler;
 * Faz 2'de öğeler yetki anahtarına göre filtrelenecek.
 */
export const PANEL_NAV: NavGroup[] = [
  {
    items: [{ href: '/panel', label: 'Genel bakış', icon: LayoutDashboard }],
  },
  {
    label: 'Sistem',
    items: [{ href: '/panel/sistem', label: 'Sistem durumu', icon: Activity }],
  },
];
