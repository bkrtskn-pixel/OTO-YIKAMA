/**
 * Entegrasyon testi: gerçek PostgreSQL'e bağlanır (DATABASE_URL).
 * Önkoşul: migration'lar uygulanmış ve seed çalıştırılmış olmalı
 * (CI bunu otomatik yapar; yerelde: pnpm db:deploy && pnpm db:seed).
 */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/infra/prisma/prisma.service';

describe('API (entegrasyon)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/system/health → veritabanı bağlı', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/system/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.connected).toBe(true);
    expect(res.body.database.appliedMigrations).toBeGreaterThan(0);
    expect(res.body.timeZone).toBe('Europe/Istanbul');
    expect(res.body.businessDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('GET /api/v1/public/site → seed edilmiş işletme bilgisi', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/public/site').expect(200);
    expect(typeof res.body.businessName).toBe('string');
    expect(res.body.businessName.length).toBeGreaterThan(0);
    // Gizli/iç alanlar public uca sızmamalı
    expect(res.body).not.toHaveProperty('quietHoursStart');
    expect(res.body).not.toHaveProperty('id');
  });

  it('bilinmeyen uç nokta Türkçe hata biçiminde 404 döner', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/yok-boyle-bir-yer').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Kayıt bulunamadı.' } });
  });

  it('güvenlik başlıkları eklenir', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/system/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  describe('veritabanı kısıtları', () => {
    it('seed: 3 sistem rolü, sahip tüm yetkilere sahip', async () => {
      const owner = await prisma.role.findUniqueOrThrow({
        where: { key: 'owner' },
        include: { _count: { select: { permissions: true } } },
      });
      const total = await prisma.permission.count();
      expect(owner._count.permissions).toBe(total);
      expect(await prisma.role.count({ where: { isSystem: true } })).toBe(3);
    });

    it('aynı normalize plaka ikinci kez eklenemez', async () => {
      const plate = `T${Date.now()}`.slice(0, 15);
      await prisma.vehicle.create({ data: { plateNormalized: plate, plateDisplay: plate } });
      await expect(
        prisma.vehicle.create({ data: { plateNormalized: plate, plateDisplay: plate } }),
      ).rejects.toThrow();
      await prisma.vehicle.delete({ where: { plateNormalized: plate } });
    });

    it('aynı araç için ikinci aktif kabul kaydı engellenir (kısmi unique index)', async () => {
      const suffix = Date.now().toString(36);
      const user = await prisma.user.create({
        data: { email: `test-${suffix}@example.test`, fullName: 'Test', passwordHash: 'x' },
      });
      const customer = await prisma.customer.create({ data: { fullName: 'Test Müşteri' } });
      const vehicle = await prisma.vehicle.create({
        data: { plateNormalized: `TST${suffix}`.toUpperCase(), plateDisplay: 'TST' },
      });
      const base = {
        customerId: customer.id,
        vehicleId: vehicle.id,
        customerNameSnapshot: 'Test Müşteri',
        plateSnapshot: 'TST',
        subtotalKurus: 75000,
        totalKurus: 75000,
        createdById: user.id,
      };
      try {
        const first = await prisma.vehicleOrder.create({ data: { ...base, orderNo: `T-${suffix}-1` } });
        await expect(
          prisma.vehicleOrder.create({ data: { ...base, orderNo: `T-${suffix}-2` } }),
        ).rejects.toThrow();

        // İlk kayıt teslim edilince aynı araç yeniden kabul edilebilir
        await prisma.vehicleOrder.update({
          where: { id: first.id },
          data: { status: 'DELIVERED', deliveredAt: new Date() },
        });
        await expect(
          prisma.vehicleOrder.create({ data: { ...base, orderNo: `T-${suffix}-3` } }),
        ).resolves.toBeTruthy();
      } finally {
        await prisma.vehicleOrder.deleteMany({ where: { vehicleId: vehicle.id } });
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    });

    it('toplam tutar tutarsızsa CHECK kısıtı reddeder', async () => {
      const suffix = Date.now().toString(36);
      const user = await prisma.user.create({
        data: { email: `chk-${suffix}@example.test`, fullName: 'Test', passwordHash: 'x' },
      });
      const customer = await prisma.customer.create({ data: { fullName: 'Test' } });
      const vehicle = await prisma.vehicle.create({
        data: { plateNormalized: `CHK${suffix}`.toUpperCase(), plateDisplay: 'CHK' },
      });
      try {
        await expect(
          prisma.vehicleOrder.create({
            data: {
              orderNo: `C-${suffix}`,
              customerId: customer.id,
              vehicleId: vehicle.id,
              customerNameSnapshot: 'Test',
              plateSnapshot: 'CHK',
              subtotalKurus: 75000,
              manualDiscountKurus: 10000,
              totalKurus: 75000, // olması gereken 65000
              createdById: user.id,
            },
          }),
        ).rejects.toThrow();
      } finally {
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    });
  });
});
