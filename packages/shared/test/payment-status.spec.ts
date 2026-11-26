import { describe, expect, it } from 'vitest';
import { derivePaymentStatus, netPaidKurus, remainingKurus } from '../src/payment-status';

describe('ödeme durumu', () => {
  it('dokümandaki örnek: 750 TL = 300 nakit + 450 kart → tamamen ödendi', () => {
    const net = netPaidKurus([
      { type: 'PAYMENT', amountKurus: 30000 },
      { type: 'PAYMENT', amountKurus: 45000 },
    ]);
    expect(net).toBe(75000);
    expect(derivePaymentStatus(75000, net)).toBe('PAID');
  });

  it('ilk ödemeden sonra kısmen ödendi, kalan 450 TL', () => {
    const net = netPaidKurus([{ type: 'PAYMENT', amountKurus: 30000 }]);
    expect(derivePaymentStatus(75000, net)).toBe('PARTIAL');
    expect(remainingKurus(75000, net)).toBe(45000);
  });

  it('iade net tahsilatı düşürür', () => {
    const net = netPaidKurus([
      { type: 'PAYMENT', amountKurus: 75000 },
      { type: 'REFUND', amountKurus: 75000 },
    ]);
    expect(net).toBe(0);
    expect(derivePaymentStatus(75000, net)).toBe('UNPAID');
  });

  it('ücretsiz (0 TL) işlem ödenmiş sayılır', () => {
    expect(derivePaymentStatus(0, 0)).toBe('PAID');
  });

  it('fazla ödeme ve negatif tutar reddedilir', () => {
    expect(() => derivePaymentStatus(75000, 80000)).toThrow();
    expect(() => netPaidKurus([{ type: 'PAYMENT', amountKurus: 0 }])).toThrow();
    expect(() => netPaidKurus([{ type: 'PAYMENT', amountKurus: -100 }])).toThrow();
  });
});
