import { describe, expect, it } from 'vitest';
import { formatPlate, isTurkishPlate, maskPlate, normalizePlate } from '../src/plate';

describe('normalizePlate', () => {
  it.each([
    ['06 ABC 123', '06ABC123'],
    ['06abc123', '06ABC123'],
    ['06-abc-123', '06ABC123'],
    ['  06 abc   123 ', '06ABC123'],
    ['06.ABC.123', '06ABC123'],
    ['34 ış 1234', '34IS1234'],
    ['35 çğü 12', '35CGU12'],
    ['06 İK 456', '06IK456'],
  ])('"%s" => "%s"', (input, expected) => {
    expect(normalizePlate(input)).toBe(expected);
  });

  it('farklı yazımlar aynı plakayı verir', () => {
    expect(normalizePlate('06 ABC 123')).toBe(normalizePlate('06abc123'));
  });
});

describe('isTurkishPlate', () => {
  it.each(['34 A 1234', '34 A 12345', '06 AB 123', '06 AB 1234', '35 ABC 12', '35 ABC 123', '81 ZZ 999', '01 A 0001'])(
    '"%s" geçerli',
    (p) => expect(isTurkishPlate(p)).toBe(true),
  );
  it.each([
    '00 A 1234', // il kodu 00 yok
    '82 A 1234', // il kodu 82 yok
    '34 A 123', // 1 harf + 3 rakam olmaz
    '34 AB 12', // 2 harf + 2 rakam olmaz
    '34 ABC 1234', // 3 harf + 4 rakam olmaz
    '34 ABCD 12',
    'B 1234 XY', // yabancı plaka
    '',
  ])('"%s" Türk plakası değil', (p) => expect(isTurkishPlate(p)).toBe(false));
});

describe('formatPlate / maskPlate', () => {
  it('görüntüleme biçimi', () => {
    expect(formatPlate('06abc123')).toBe('06 ABC 123');
    expect(formatPlate('b-1234-xy')).toBe('B1234XY');
  });
  it('kısmi maskeleme', () => {
    expect(maskPlate('06 ABC 123')).toBe('06 *** 123');
    expect(maskPlate('B1234XY')).toBe('B1***XY');
  });
});
