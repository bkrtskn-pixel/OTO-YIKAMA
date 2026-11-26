/**
 * Production-güvenli başlangıç verisi (idempotent — tekrar çalıştırılabilir).
 * - Roller, yetkiler ve varsayılan rol-yetki eşlemesi
 * - Araç tipleri, ödeme yöntemleri, gider kategorileri
 * - İşletme ayarları (yoksa)
 *
 * Örnek müşteri/araç verisi BURADA YOKTUR. İşletme sahibi hesabı Faz 2'deki
 * kurulum komutuyla oluşturulur.
 */
import { PrismaClient, type PaymentMethodKind } from '@prisma/client';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  PERMISSION_KEYS,
  SYSTEM_ROLES,
  type SystemRoleKey,
} from '@kuzhan/shared';

const prisma = new PrismaClient();

const VEHICLE_TYPES = ['Otomobil', 'SUV / Arazi', 'Ticari / Minibüs', 'Motosiklet'];

const PAYMENT_METHODS: { name: string; kind: PaymentMethodKind }[] = [
  { name: 'Nakit', kind: 'CASH' },
  { name: 'Kredi / Banka kartı', kind: 'CARD' },
  { name: 'Havale / EFT', kind: 'BANK_TRANSFER' },
];

const EXPENSE_CATEGORIES = [
  'Elektrik',
  'Su',
  'Kira',
  'Personel gideri',
  'Temizlik ve işletme giderleri',
  'Bakım giderleri',
  'Diğer giderler',
];

const DEFAULT_WORKING_HOURS = {
  mon: { open: '08:30', close: '19:00' },
  tue: { open: '08:30', close: '19:00' },
  wed: { open: '08:30', close: '19:00' },
  thu: { open: '08:30', close: '19:00' },
  fri: { open: '08:30', close: '19:00' },
  sat: { open: '08:30', close: '19:00' },
  sun: null,
};

async function seedAccess() {
  for (const key of PERMISSION_KEYS) {
    const def = PERMISSIONS[key];
    await prisma.permission.upsert({
      where: { key },
      update: { group: def.group, description: def.label },
      create: { key, group: def.group, description: def.label },
    });
  }

  const permissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const idByKey = new Map(permissions.map((p) => [p.key, p.id]));

  for (const [roleKey, def] of Object.entries(SYSTEM_ROLES) as [SystemRoleKey, (typeof SYSTEM_ROLES)[SystemRoleKey]][]) {
    const existing = await prisma.role.findUnique({ where: { key: roleKey } });
    if (existing) {
      // Var olan rolün yetkilerine DOKUNMA: işletme sahibi değiştirmiş olabilir.
      // Sadece sahip rolü her zaman tüm yetkilere sahip olmalı (yeni eklenen yetkiler dahil).
      if (roleKey === 'owner') {
        await prisma.rolePermission.createMany({
          data: PERMISSION_KEYS.map((k) => ({ roleId: existing.id, permissionId: idByKey.get(k)! })),
          skipDuplicates: true,
        });
      }
      continue;
    }
    const role = await prisma.role.create({
      data: { key: roleKey, name: def.name, description: def.description, isSystem: true },
    });
    await prisma.rolePermission.createMany({
      data: DEFAULT_ROLE_PERMISSIONS[roleKey].map((k) => ({
        roleId: role.id,
        permissionId: idByKey.get(k)!,
      })),
      skipDuplicates: true,
    });
  }
}

async function seedLookups() {
  for (const [i, name] of VEHICLE_TYPES.entries()) {
    await prisma.vehicleType.upsert({
      where: { name },
      update: {},
      create: { name, sortOrder: i },
    });
  }
  for (const [i, m] of PAYMENT_METHODS.entries()) {
    await prisma.paymentMethod.upsert({
      where: { name: m.name },
      update: {},
      create: { name: m.name, kind: m.kind, sortOrder: i },
    });
  }
  for (const name of EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } });
  }
}

async function seedSettings() {
  const businessName = process.env.SEED_BUSINESS_NAME ?? 'KUZHAN Oto Yıkama';
  await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName,
      slogan: 'Aracınız ilk günkü gibi parlasın.',
      workingHours: DEFAULT_WORKING_HOURS,
    },
  });
}

async function main() {
  await seedAccess();
  await seedLookups();
  await seedSettings();
  const counts = {
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    vehicleTypes: await prisma.vehicleType.count(),
    paymentMethods: await prisma.paymentMethod.count(),
    expenseCategories: await prisma.expenseCategory.count(),
  };
  console.log('Seed tamamlandı:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
