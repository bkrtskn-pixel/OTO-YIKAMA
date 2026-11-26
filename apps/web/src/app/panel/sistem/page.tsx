import type { ReactNode } from 'react';
import { formatDateTimeTR } from '@kuzhan/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiErrorState } from '@/components/panel/api-error-state';
import { PageHeader } from '@/components/panel/page-header';
import { apiGet } from '@/lib/api';
import type { HealthResult } from '@/lib/types';

export const metadata = { title: 'Sistem durumu' };

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return [d && `${d} gün`, h && `${h} sa`, `${m} dk`].filter(Boolean).join(' ');
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default async function SystemPage() {
  const health = await apiGet<HealthResult>('/system/health');

  return (
    <>
      <PageHeader title="Sistem durumu" description="API, veritabanı ve sunucu bilgileri (canlı)." />
      {!health.ok ? (
        <ApiErrorState error={health.error} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Uygulama</CardTitle>
              <Badge tone={health.data.status === 'ok' ? 'success' : 'danger'}>
                {health.data.status === 'ok' ? 'Çalışıyor' : 'Sorunlu'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <dl className="divide-y divide-slate-100">
                <Row label="Sürüm">v{health.data.version}</Row>
                <Row label="Sunucu saati">{formatDateTimeTR(health.data.serverTime)}</Row>
                <Row label="İş günü">{health.data.businessDate}</Row>
                <Row label="Saat dilimi">{health.data.timeZone}</Row>
                <Row label="Çalışma süresi">{formatUptime(health.data.uptimeSeconds)}</Row>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Veritabanı</CardTitle>
              <Badge tone={health.data.database.connected ? 'success' : 'danger'}>
                {health.data.database.connected ? 'Bağlı' : 'Bağlı değil'}
              </Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <dl className="divide-y divide-slate-100">
                <Row label="PostgreSQL sürümü">{health.data.database.serverVersion ?? '—'}</Row>
                <Row label="Yanıt süresi">
                  {health.data.database.latencyMs != null ? `${health.data.database.latencyMs} ms` : '—'}
                </Row>
                <Row label="Uygulanmış migration">{health.data.database.appliedMigrations ?? '—'}</Row>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
