/**
 * Plaka normalizasyonu (bkz. docs/01 E-05).
 * "06 ABC 123", "06abc123", "06-abc-123", "06 abç 123" => "06ABC123"
 */

const TR_CHAR_MAP: Record<string, string> = {
  ç: 'C',
  Ç: 'C',
  ğ: 'G',
  Ğ: 'G',
  ı: 'I',
  i: 'I',
  İ: 'I',
  ö: 'O',
  Ö: 'O',
  ş: 'S',
  Ş: 'S',
  ü: 'U',
  Ü: 'U',
};

export function normalizePlate(input: string): string {
  const mapped = input.replace(/[çÇğĞıiİöÖşŞüÜ]/g, (ch) => TR_CHAR_MAP[ch] ?? ch);
  // Yerel ayardan bağımsız büyük harf (Türkçe 'i' -> 'İ' sorunu yaşanmasın diye önce eşledik)
  return mapped.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Türk plaka biçimi: il kodu (01–81) + harf grubu + rakam grubu
 *  - 1 harf  → 4 veya 5 rakam   (34 A 1234)
 *  - 2 harf  → 3 veya 4 rakam   (06 AB 123)
 *  - 3 harf  → 2 veya 3 rakam   (35 ABC 12)
 */
const TR_PLATE = /^(0[1-9]|[1-7]\d|8[01])([A-Z]{1,3})(\d{2,5})$/;

export interface ParsedTurkishPlate {
  province: string;
  letters: string;
  digits: string;
}

export function parseTurkishPlate(input: string): ParsedTurkishPlate | null {
  const n = normalizePlate(input);
  const m = TR_PLATE.exec(n);
  if (!m) return null;
  const [, province, letters, digits] = m as unknown as [string, string, string, string];
  const ok =
    (letters.length === 1 && (digits.length === 4 || digits.length === 5)) ||
    (letters.length === 2 && (digits.length === 3 || digits.length === 4)) ||
    (letters.length === 3 && (digits.length === 2 || digits.length === 3));
  return ok ? { province, letters, digits } : null;
}

export function isTurkishPlate(input: string): boolean {
  return parseTurkishPlate(input) !== null;
}

/** Görüntüleme biçimi: "06 ABC 123". Türk plakası değilse normalize hâli döner. */
export function formatPlate(input: string): string {
  const p = parseTurkishPlate(input);
  return p ? `${p.province} ${p.letters} ${p.digits}` : normalizePlate(input);
}

/** Herkese açık sayfalarda kısmi gösterim: "06 *** 123" */
export function maskPlate(input: string): string {
  const p = parseTurkishPlate(input);
  if (p) return `${p.province} ${'*'.repeat(p.letters.length)} ${p.digits}`;
  const n = normalizePlate(input);
  if (n.length <= 4) return '*'.repeat(n.length);
  return `${n.slice(0, 2)}${'*'.repeat(n.length - 4)}${n.slice(-2)}`;
}

export const PLATE_MIN_LENGTH = 2;
export const PLATE_MAX_LENGTH = 15;
