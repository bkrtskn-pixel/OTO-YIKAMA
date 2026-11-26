/**
 * Yetki anahtarları ve varsayılan rol matrisi (bkz. docs/02 §7.8).
 * Veritabanındaki `permissions` tablosu bu listeden seed edilir.
 * İşletme sahibi rollerin yetkilerini panelden değiştirebilir; buradaki
 * matris sadece ilk kurulum varsayılanıdır.
 */

export const PERMISSIONS = {
  // Araç kabul ve operasyon
  'orders.view': { group: 'Araç işlemleri', label: 'Araçları görüntüle' },
  'orders.create': { group: 'Araç işlemleri', label: 'Araç kabul et' },
  'orders.update': { group: 'Araç işlemleri', label: 'Araç kaydını düzenle' },
  'orders.transition': { group: 'Araç işlemleri', label: 'Araç durumunu değiştir' },
  'orders.cancel_in_progress': { group: 'Araç işlemleri', label: 'İşlemdeki aracı iptal et' },
  'orders.correct_status': { group: 'Araç işlemleri', label: 'Teslim/iptal düzeltmesi yap' },
  'orders.manual_discount': { group: 'Araç işlemleri', label: 'Manuel indirim uygula' },
  'orders.price_override': { group: 'Araç işlemleri', label: 'Liste fiyatını değiştir' },

  // Müşteri
  'customers.view': { group: 'Müşteriler', label: 'Müşterileri görüntüle' },
  'customers.manage': { group: 'Müşteriler', label: 'Müşteri düzenle / birleştir' },
  'customers.export': { group: 'Müşteriler', label: 'Müşteri verisini dışa aktar' },
  'customers.anonymize': { group: 'Müşteriler', label: 'Müşteriyi anonimleştir' },

  // Katalog
  'catalog.manage': { group: 'Hizmetler', label: 'Hizmet ve fiyat yönet' },

  // Finans
  'payments.create': { group: 'Finans', label: 'Ödeme al' },
  'payments.refund': { group: 'Finans', label: 'İade yap' },
  'cash.view': { group: 'Finans', label: 'Kasa hareketlerini görüntüle' },
  'cash.manual_entry': { group: 'Finans', label: 'Manuel kasa girişi/çıkışı' },
  'cash.day_close': { group: 'Finans', label: 'Gün sonu kapat' },
  'cash.reopen_day': { group: 'Finans', label: 'Kapanmış günü aç' },
  'expenses.create': { group: 'Finans', label: 'Gider ekle' },
  'expenses.reverse': { group: 'Finans', label: 'Gider ters kaydı' },
  'accounts.manage': { group: 'Finans', label: 'Cari hesap yönet' },

  // Raporlar
  'reports.finance': { group: 'Raporlar', label: 'Finansal raporlar' },
  'reports.operations': { group: 'Raporlar', label: 'Operasyon raporları' },
  'reports.customers': { group: 'Raporlar', label: 'Müşteri raporları' },
  'reports.staff': { group: 'Raporlar', label: 'Personel performans raporları' },
  'reports.quality': { group: 'Raporlar', label: 'Kalite raporları' },

  // Pazarlama
  'campaigns.manage': { group: 'Pazarlama', label: 'Kampanya yönet' },
  'marketing.send': { group: 'Pazarlama', label: 'Toplu mesaj gönder' },
  'surveys.manage': { group: 'Pazarlama', label: 'Anket ve şikâyet yönet' },

  // Yönetim
  'users.manage': { group: 'Yönetim', label: 'Kullanıcı ve personel yönet' },
  'roles.manage': { group: 'Yönetim', label: 'Rol ve yetki yönet' },
  'settings.manage': { group: 'Yönetim', label: 'İşletme ayarları' },
  'integrations.manage': { group: 'Yönetim', label: 'Entegrasyon ayarları' },
  'website.manage': { group: 'Yönetim', label: 'Site içeriği' },
  'audit.view': { group: 'Yönetim', label: 'Audit log görüntüle' },
  'system.view': { group: 'Yönetim', label: 'Sistem durumu' },
} as const satisfies Record<string, { group: string; label: string }>;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

export type SystemRoleKey = 'owner' | 'manager' | 'staff';

export const SYSTEM_ROLES: Record<SystemRoleKey, { name: string; description: string }> = {
  owner: { name: 'İşletme sahibi', description: 'Tüm modüllere ve finansal raporlara erişir.' },
  manager: { name: 'Yönetici', description: 'Operasyon, müşteri ve kampanyaları yönetir.' },
  staff: { name: 'Personel', description: 'Araç kabul, durum ve teslim işlemleri.' },
};

const MANAGER: PermissionKey[] = [
  'orders.view',
  'orders.create',
  'orders.update',
  'orders.transition',
  'orders.cancel_in_progress',
  'orders.manual_discount',
  'customers.view',
  'customers.manage',
  'catalog.manage',
  'payments.create',
  'payments.refund',
  'cash.view',
  'cash.manual_entry',
  'cash.day_close',
  'expenses.create',
  'reports.operations',
  'reports.customers',
  'reports.quality',
  'campaigns.manage',
  'marketing.send',
  'surveys.manage',
  'website.manage',
  'system.view',
];

const STAFF: PermissionKey[] = [
  'orders.view',
  'orders.create',
  'orders.transition',
  'customers.view',
  'payments.create',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRoleKey, readonly PermissionKey[]> = {
  owner: PERMISSION_KEYS,
  manager: MANAGER,
  staff: STAFF,
};
