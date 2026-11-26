import { describe, expect, it } from 'vitest';
import { DEFAULT_ROLE_PERMISSIONS, PERMISSION_KEYS } from '../src/permissions';
import { toBusinessDate } from '../src/time';

describe('varsayılan rol yetkileri', () => {
  it('sahip tüm yetkilere sahiptir', () => {
    expect([...DEFAULT_ROLE_PERMISSIONS.owner].sort()).toEqual([...PERMISSION_KEYS].sort());
  });
  it('personel finansal raporları göremez, iade yapamaz', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.staff).not.toContain('reports.finance');
    expect(DEFAULT_ROLE_PERMISSIONS.staff).not.toContain('payments.refund');
    expect(DEFAULT_ROLE_PERMISSIONS.staff).toContain('orders.create');
  });
  it('yönetici varsayılan olarak finansal rapor ve rol yönetimi göremez', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.manager).not.toContain('reports.finance');
    expect(DEFAULT_ROLE_PERMISSIONS.manager).not.toContain('roles.manage');
  });
  it('rollerdeki her anahtar tanımlı bir yetkidir', () => {
    for (const keys of Object.values(DEFAULT_ROLE_PERMISSIONS)) {
      for (const k of keys) expect(PERMISSION_KEYS).toContain(k);
    }
  });
});

describe('iş günü (Europe/Istanbul)', () => {
  it('UTC 21:30 İstanbul\'da ertesi gündür (UTC+3)', () => {
    expect(toBusinessDate(new Date('2026-11-26T21:30:00Z'))).toBe('2026-11-27');
  });
  it('UTC 20:59 hâlâ aynı gündür', () => {
    expect(toBusinessDate(new Date('2026-11-26T20:59:59Z'))).toBe('2026-11-26');
  });
});
