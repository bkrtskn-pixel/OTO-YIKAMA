/**
 * Saat dilimi kuralları (bkz. docs/02 §5.1):
 * Veritabanında her şey UTC `timestamptz`. "İş günü" her zaman
 * Europe/Istanbul'a göre hesaplanır.
 */

export const BUSINESS_TIME_ZONE = 'Europe/Istanbul';

const ymdFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Bir anın İstanbul'a göre iş günü: "2026-11-26" */
export function toBusinessDate(instant: Date): string {
  return ymdFormatter.format(instant);
}

const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: BUSINESS_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  timeZone: BUSINESS_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** "26.11.2026 14:05" */
export function formatDateTimeTR(instant: Date | string): string {
  return dateTimeFormatter.format(new Date(instant));
}

/** "26.11.2026" */
export function formatDateTR(instant: Date | string): string {
  return dateFormatter.format(new Date(instant));
}
