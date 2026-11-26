import { assertKurus, type Kurus } from './money';

export const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Ödenmedi',
  PARTIAL: 'Kısmen ödendi',
  PAID: 'Tamamen ödendi',
};

export interface PaymentLike {
  type: 'PAYMENT' | 'REFUND';
  amountKurus: Kurus;
}

/** Net tahsilat = ödemeler − iadeler */
export function netPaidKurus(payments: readonly PaymentLike[]): Kurus {
  let net = 0;
  for (const p of payments) {
    assertKurus(p.amountKurus);
    if (p.amountKurus <= 0) throw new RangeError('Ödeme tutarı sıfırdan büyük olmalıdır.');
    net += p.type === 'PAYMENT' ? p.amountKurus : -p.amountKurus;
  }
  return net;
}

/** Ödeme durumu araç durumundan bağımsızdır (bkz. docs/02 §7.2-3). */
export function derivePaymentStatus(totalKurus: Kurus, netPaid: Kurus): PaymentStatus {
  assertKurus(totalKurus);
  assertKurus(netPaid);
  if (netPaid < 0) throw new RangeError('Net tahsilat negatif olamaz.');
  if (netPaid > totalKurus) throw new RangeError('Net tahsilat toplam tutarı aşamaz.');
  if (netPaid === 0) return totalKurus === 0 ? 'PAID' : 'UNPAID';
  return netPaid === totalKurus ? 'PAID' : 'PARTIAL';
}

/** Bu siparişe şu an en fazla ne kadar ödeme alınabilir */
export function remainingKurus(totalKurus: Kurus, netPaid: Kurus): Kurus {
  return Math.max(0, totalKurus - netPaid);
}
