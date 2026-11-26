import 'server-only';
import { cache } from 'react';
import { apiGet } from './api';
import type { PublicSite } from './types';

/** Aynı istek içinde site verisini tek kez çeker (layout + sayfa + metadata). */
export const getPublicSite = cache(() => apiGet<PublicSite>('/public/site'));

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Marka rengi sadece güvenli hex değerse uygulanır (CSS enjeksiyonu önlemi). */
export function safeBrandColor(color: string | undefined | null): string {
  return color && HEX.test(color) ? color : '#0e7490';
}

const DAYS: { key: keyof PublicSite['workingHours']; label: string }[] = [
  { key: 'mon', label: 'Pazartesi' },
  { key: 'tue', label: 'Salı' },
  { key: 'wed', label: 'Çarşamba' },
  { key: 'thu', label: 'Perşembe' },
  { key: 'fri', label: 'Cuma' },
  { key: 'sat', label: 'Cumartesi' },
  { key: 'sun', label: 'Pazar' },
];

export function workingHoursRows(hours: PublicSite['workingHours']) {
  return DAYS.map(({ key, label }) => {
    const h = hours[key];
    return { label, value: h ? `${h.open} – ${h.close}` : 'Kapalı' };
  });
}

/** "+90 532 000 00 00" → "905320000000" (wa.me biçimi) */
export function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}
