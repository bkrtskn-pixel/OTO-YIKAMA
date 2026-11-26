/**
 * Para birimi kuralları (bkz. docs/02 §7.2):
 * - Tüm tutarlar kuruş cinsinden TAMSAYI'dır. 750,00 TL = 75000.
 * - Float ile para hesabı yapılmaz.
 * - Yüzdeler "baz puan" (bps) ile ifade edilir: %12,5 = 1250 bps, %100 = 10000 bps.
 */

export type Kurus = number;

export const BPS_100_PERCENT = 10_000;

export function assertKurus(value: number, field = 'tutar'): asserts value is Kurus {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${field} kuruş cinsinden tamsayı olmalıdır: ${value}`);
  }
}

export function sumKurus(values: readonly Kurus[]): Kurus {
  let total = 0;
  for (const v of values) {
    assertKurus(v);
    total += v;
  }
  assertKurus(total, 'toplam');
  return total;
}

/**
 * Bir tutarın yüzdesini kuruşa yuvarlayarak hesaplar (yarım yukarı).
 * percentOfKurus(75000, 1000) => 7500  (750 TL'nin %10'u = 75 TL)
 */
export function percentOfKurus(amount: Kurus, bps: number): Kurus {
  assertKurus(amount);
  if (!Number.isInteger(bps) || bps < 0 || bps > BPS_100_PERCENT) {
    throw new RangeError(`Yüzde 0 ile 10000 bps arasında olmalıdır: ${bps}`);
  }
  if (amount < 0) throw new RangeError('Negatif tutarın yüzdesi hesaplanmaz.');
  // Tamsayı aritmetiği: (amount * bps + 5000) / 10000, aşağı yuvarla => yarım yukarı
  return Math.floor((amount * bps + BPS_100_PERCENT / 2) / BPS_100_PERCENT);
}

/**
 * Bir toplamı, ağırlıklara orantılı olarak kuruş kaybı olmadan dağıtır
 * (en büyük kalan yöntemi). Dönen parçaların toplamı her zaman `total`'a eşittir.
 *
 * Kullanım: sipariş indirimini kalemlere dağıtmak. Hizmet bazında gelir
 * raporu böylece kuruşu kuruşuna sipariş toplamına eşit olur.
 */
export function allocateKurus(total: Kurus, weights: readonly number[]): Kurus[] {
  assertKurus(total);
  if (total < 0) throw new RangeError('Dağıtılacak tutar negatif olamaz.');
  if (weights.length === 0) {
    if (total === 0) return [];
    throw new RangeError('Ağırlık listesi boş olamaz.');
  }
  for (const w of weights) {
    if (!Number.isSafeInteger(w) || w < 0) throw new RangeError(`Geçersiz ağırlık: ${w}`);
  }
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum === 0) {
    if (total === 0) return weights.map(() => 0);
    throw new RangeError('Ağırlıkların toplamı sıfır, tutar dağıtılamaz.');
  }

  const base = weights.map((w) => Math.floor((total * w) / weightSum));
  const remainders = weights.map((w, i) => ({ i, r: (total * w) % weightSum }));
  let leftover = total - base.reduce((a, b) => a + b, 0);
  // Kalanı en büyük artığa sahip olanlara 1'er kuruş dağıt; eşitlikte önce gelen kazanır.
  remainders.sort((a, b) => b.r - a.r || a.i - b.i);
  for (let k = 0; leftover > 0; k++, leftover--) {
    const target = remainders[k % remainders.length]!;
    base[target.i]! += 1;
  }
  return base;
}

const tryFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 75000 => "₺750,00" */
export function formatTRY(amount: Kurus): string {
  assertKurus(amount);
  return tryFormatter.format(amount / 100);
}

/**
 * Kullanıcı girişini kuruşa çevirir. Türkçe biçimi kabul eder:
 * "750" | "750,5" | "750,50" | "1.250,00" | "1250.00" (tek nokta + 2 hane ondalık sayılır)
 * Geçersiz girişte null döner.
 */
export function parseTRYToKurus(input: string): Kurus | null {
  const s = input.trim().replace(/\s|₺|TL/gi, '');
  if (s === '') return null;

  let normalized: string;
  if (s.includes(',')) {
    // Türkçe: nokta binlik ayırıcı, virgül ondalık
    if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(s)) return null;
    normalized = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+\.\d{1,2}$/.test(s)) {
    normalized = s; // "1250.50"
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    normalized = s.replace(/\./g, ''); // "1.250"
  } else if (/^\d+$/.test(s)) {
    normalized = s;
  } else {
    return null;
  }

  const [lira, frac = ''] = normalized.split('.');
  const kurus = Number(lira) * 100 + Number(frac.padEnd(2, '0'));
  return Number.isSafeInteger(kurus) ? kurus : null;
}
