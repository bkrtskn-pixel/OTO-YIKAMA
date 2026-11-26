import { describe, expect, it } from 'vitest';
import { allocateKurus, formatTRY, parseTRYToKurus, percentOfKurus, sumKurus } from '../src/money';

describe('percentOfKurus', () => {
  it('750 TL için %10 = 75 TL', () => {
    expect(percentOfKurus(75000, 1000)).toBe(7500);
  });
  it('yarım kuruşu yukarı yuvarlar', () => {
    // 0,05 TL'nin %50'si = 2,5 kuruş -> 3
    expect(percentOfKurus(5, 5000)).toBe(3);
    // 0,05 TL'nin %10'u = 0,5 kuruş -> 1
    expect(percentOfKurus(5, 1000)).toBe(1);
    // 0,04 TL'nin %10'u = 0,4 kuruş -> 0
    expect(percentOfKurus(4, 1000)).toBe(0);
  });
  it('%0 ve %100 sınırları', () => {
    expect(percentOfKurus(12345, 0)).toBe(0);
    expect(percentOfKurus(12345, 10000)).toBe(12345);
  });
  it('geçersiz yüzde ve float tutarı reddeder', () => {
    expect(() => percentOfKurus(100, 10001)).toThrow();
    expect(() => percentOfKurus(100, -1)).toThrow();
    expect(() => percentOfKurus(10.5, 1000)).toThrow();
  });
});

describe('allocateKurus', () => {
  it('parçaların toplamı her zaman toplama eşittir', () => {
    const parts = allocateKurus(10000, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
    expect(parts).toEqual([3334, 3333, 3333]);
  });
  it('indirimi kalem fiyatlarına orantılı dağıtır', () => {
    // 250 TL indirim; kalemler 500 TL ve 250 TL
    expect(allocateKurus(25000, [50000, 25000])).toEqual([16667, 8333]);
  });
  it('sıfır ağırlıklı kaleme pay vermez', () => {
    expect(allocateKurus(1000, [0, 3, 1])).toEqual([0, 750, 250]);
  });
  it('rastgele girdilerde değişmez kuralı korur', () => {
    for (let n = 0; n < 200; n++) {
      const weights = Array.from({ length: 1 + (n % 7) }, (_, i) => ((n * 7919 + i * 104729) % 90000) + 1);
      const total = (n * 3571) % 500000;
      const parts = allocateKurus(total, weights);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      parts.forEach((p) => expect(Number.isInteger(p) && p >= 0).toBe(true));
    }
  });
  it('hatalı girdileri reddeder', () => {
    expect(() => allocateKurus(100, [])).toThrow();
    expect(() => allocateKurus(100, [0, 0])).toThrow();
    expect(() => allocateKurus(-1, [1])).toThrow();
  });
});

describe('sumKurus', () => {
  it('toplar ve float kabul etmez', () => {
    expect(sumKurus([30000, 45000])).toBe(75000);
    expect(() => sumKurus([1.5])).toThrow();
  });
});

describe('formatTRY / parseTRYToKurus', () => {
  it('Türkçe biçimlendirir', () => {
    // Intl çıktısındaki boşluk karakteri ortama göre değişebilir; rakamları kontrol et
    expect(formatTRY(75000).replace(/\s/g, '')).toBe('₺750,00');
    expect(formatTRY(125050).replace(/\s/g, '')).toBe('₺1.250,50');
  });
  it.each<[string, number]>([
    ['750', 75000],
    ['750,5', 75050],
    ['750,50', 75050],
    ['1.250,00', 125000],
    ['1250.00', 125000],
    ['1250.5', 125050],
    ['1.250', 125000],
    ['₺ 300', 30000],
    ['450 TL', 45000],
    ['0,01', 1],
  ])('"%s" => %i kuruş', (input, expected) => {
    expect(parseTRYToKurus(input)).toBe(expected);
  });
  it.each(['', 'abc', '1,2,3', '12,345', '-5', '1.25.0'])('"%s" geçersiz', (input) => {
    expect(parseTRYToKurus(input)).toBeNull();
  });
});
