import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BUSINESS_TIME_ZONE, toBusinessDate } from '@kuzhan/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { Env } from '../../config/env';

export interface HealthResult {
  status: 'ok' | 'degraded';
  version: string;
  serverTime: string;
  businessDate: string;
  timeZone: string;
  uptimeSeconds: number;
  database: {
    connected: boolean;
    latencyMs: number | null;
    serverVersion: string | null;
    appliedMigrations: number | null;
  };
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async health(): Promise<HealthResult> {
    const now = new Date();
    const database: HealthResult['database'] = {
      connected: false,
      latencyMs: null,
      serverVersion: null,
      appliedMigrations: null,
    };

    try {
      const started = performance.now();
      const [row] = await this.prisma.$queryRaw<{ v: string }[]>`SELECT current_setting('server_version') AS v`;
      database.latencyMs = Math.round(performance.now() - started);
      database.connected = true;
      database.serverVersion = row?.v ?? null;
      const [m] = await this.prisma.$queryRaw<{ n: number }[]>`
        SELECT count(*)::int AS n FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
      database.appliedMigrations = m?.n ?? 0;
    } catch (err) {
      this.logger.error(`Veritabanı sağlık kontrolü başarısız: ${(err as Error).message}`);
    }

    return {
      status: database.connected ? 'ok' : 'degraded',
      version: this.config.get('APP_VERSION', { infer: true }),
      serverTime: now.toISOString(),
      businessDate: toBusinessDate(now),
      timeZone: BUSINESS_TIME_ZONE,
      uptimeSeconds: Math.round(process.uptime()),
      database,
    };
  }
}
