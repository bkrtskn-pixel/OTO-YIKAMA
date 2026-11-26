import { describe, expect, it } from 'vitest';
import {
  ORDER_STATUSES,
  allowedNextStatuses,
  canTransition,
  getTransitionRule,
  isTerminalStatus,
  timestampFieldFor,
} from '../src/order-status';

describe('araç durum makinesi', () => {
  it('normal akış: Bekliyor → Yıkamaya alındı → Yıkama → Hazır → Teslim', () => {
    expect(canTransition('WAITING', 'TAKEN_IN')).toBe(true);
    expect(canTransition('TAKEN_IN', 'WASHING')).toBe(true);
    expect(canTransition('WASHING', 'READY')).toBe(true);
    expect(canTransition('READY', 'DELIVERED')).toBe(true);
  });

  it('kısayol: Bekliyor → Yıkama devam ediyor izinli (K-07)', () => {
    expect(canTransition('WAITING', 'WASHING')).toBe(true);
  });

  it('hazır olmadan teslim edilemez', () => {
    expect(canTransition('WAITING', 'DELIVERED')).toBe(false);
    expect(canTransition('WASHING', 'DELIVERED')).toBe(false);
  });

  it('teslim ve iptal terminaldir; hiçbir yere geçilemez', () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransition('DELIVERED', to)).toBe(false);
      expect(canTransition('CANCELLED', to)).toBe(false);
    }
    expect(isTerminalStatus('DELIVERED')).toBe(true);
    expect(isTerminalStatus('READY')).toBe(false);
  });

  it('hazırdan geri alma gerekçe ister', () => {
    expect(getTransitionRule('READY', 'WASHING')?.requiresReason).toBe(true);
  });

  it('her iptal gerekçe ister; işlemdeki araç ek yetki ister', () => {
    for (const from of ['WAITING', 'TAKEN_IN', 'WASHING', 'READY'] as const) {
      expect(getTransitionRule(from, 'CANCELLED')?.requiresReason).toBe(true);
    }
    expect(getTransitionRule('WAITING', 'CANCELLED')?.extraPermission).toBeUndefined();
    expect(getTransitionRule('WASHING', 'CANCELLED')?.extraPermission).toBe('orders.cancel_in_progress');
  });

  it('aynı duruma geçiş yoktur', () => {
    for (const s of ORDER_STATUSES) expect(canTransition(s, s)).toBe(false);
  });

  it('izinli sonraki durumlar listesi', () => {
    expect(allowedNextStatuses('READY').sort()).toEqual(['CANCELLED', 'DELIVERED', 'WASHING']);
  });

  it('zaman damgası eşlemesi', () => {
    expect(timestampFieldFor('WASHING')).toBe('workStartedAt');
    expect(timestampFieldFor('READY')).toBe('readyAt');
    expect(timestampFieldFor('WAITING')).toBeNull();
  });
});
