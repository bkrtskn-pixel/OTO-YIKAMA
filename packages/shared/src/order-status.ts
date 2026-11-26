/**
 * Araç durum makinesi (bkz. docs/02 §6.2). Backend bu tanımı zorunlu kılar;
 * arayüz sadece izinli butonları göstermek için kullanır.
 */

export const ORDER_STATUSES = [
  'WAITING',
  'TAKEN_IN',
  'WASHING',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  WAITING: 'Bekliyor',
  TAKEN_IN: 'Yıkamaya alındı',
  WASHING: 'Yıkama devam ediyor',
  READY: 'Hazır',
  DELIVERED: 'Teslim edildi',
  CANCELLED: 'İptal edildi',
};

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = ['DELIVERED', 'CANCELLED'];

export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  'WAITING',
  'TAKEN_IN',
  'WASHING',
  'READY',
];

interface TransitionRule {
  /** Gerekçe girilmesi zorunlu mu */
  requiresReason: boolean;
  /** Varsayılan geçiş yetkisinin üstünde ek yetki gerekiyorsa anahtarı */
  extraPermission?: string;
}

const T = (requiresReason = false, extraPermission?: string): TransitionRule => ({
  requiresReason,
  extraPermission,
});

export const ORDER_TRANSITIONS: Readonly<
  Record<OrderStatus, Partial<Record<OrderStatus, TransitionRule>>>
> = {
  WAITING: {
    TAKEN_IN: T(),
    WASHING: T(),
    CANCELLED: T(true),
  },
  TAKEN_IN: {
    WASHING: T(),
    READY: T(),
    CANCELLED: T(true),
  },
  WASHING: {
    READY: T(),
    CANCELLED: T(true, 'orders.cancel_in_progress'),
  },
  READY: {
    WASHING: T(true),
    DELIVERED: T(),
    CANCELLED: T(true, 'orders.cancel_in_progress'),
  },
  DELIVERED: {},
  CANCELLED: {},
};

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export function getTransitionRule(from: OrderStatus, to: OrderStatus): TransitionRule | null {
  return ORDER_TRANSITIONS[from][to] ?? null;
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return getTransitionRule(from, to) !== null;
}

export function allowedNextStatuses(from: OrderStatus): OrderStatus[] {
  return Object.keys(ORDER_TRANSITIONS[from]) as OrderStatus[];
}

/** Bu geçişte hangi zaman damgası (ilk kez) set edilmeli */
export function timestampFieldFor(
  to: OrderStatus,
): 'workStartedAt' | 'readyAt' | 'deliveredAt' | 'cancelledAt' | null {
  switch (to) {
    case 'TAKEN_IN':
    case 'WASHING':
      return 'workStartedAt';
    case 'READY':
      return 'readyAt';
    case 'DELIVERED':
      return 'deliveredAt';
    case 'CANCELLED':
      return 'cancelledAt';
    default:
      return null;
  }
}
