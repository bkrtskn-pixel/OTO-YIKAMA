import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, ShieldAlert } from 'lucide-react';
import { formatDateTR } from '@kuzhan/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/panel/page-header';
import { apiGet } from '@/lib/api';
import type { HealthResult } from '@/lib/types';

export const metadata = { title: 'Genel bakış' };

const PHASES: { no: number; title: string; done: boolean }[] = [
  { no: 1, title: 'Altyapı, veritabanı, tasarım sistemi', done: true },
  { no: 2, title: 'Giriş, roller ve yetkiler, audit log', done: false },
  { no: 3, title: 'Dashboard (gerçek verilerle)', done: false },
  { no: 4, title: 'Müşteri ve araç yönetimi', done: false },
  { no: 5, title: 'Araç kabul ve durum takibi', done: false },
];

export default async function DashboardPage() {
  const health = await apiGet<HealthResult>('/system/health');

  return (
    <>
      <PageHeader
        title="Genel bakış"
        description={health.ok ? `İş günü: ${formatDateTR(health.data.serverTime)}` : undefined}
      />

      <div
        role="note"
        className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
      >
        <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold">Geliştirme sürümü.</strong> Giriş ve yetki sistemi Faz 2&apos;de
          eklenecek. Bu sürüm gerçek müşteri verisiyle veya herkese açık bir sunucuda kullanılmamalıdır.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sistem</CardTitle>
              <CardDescription>API ve veritabanı bağlantısı</CardDescription>
            </div>
            {health.ok ? (
              <Badge tone={health.data.status === 'ok' ? 'success' : 'danger'}>
                {health.data.status === 'ok' ? 'Çalışıyor' : 'Sorunlu'}
              </Badge>
            ) : (
              <Badge tone="danger">Ulaşılamıyor</Badge>
            )}
          </CardHeader>
          <CardContent>
            {health.ok ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Veritabanı</dt>
                  <dd className="font-medium">{health.data.database.connected ? 'Bağlı' : 'Bağlı değil'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Sürüm</dt>
                  <dd className="font-medium">v{health.data.version}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-rose-700">{health.error.message}</p>
            )}
            <Link
              href="/panel/sistem"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Ayrıntılar <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Geliştirme durumu</CardTitle>
              <CardDescription>
                Araç, ciro ve müşteri kartları ilgili modüller tamamlandıkça gerçek verilerle burada yer alacak.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2.5 text-sm">
              {PHASES.map((p) => (
                <li key={p.no} className="flex items-center gap-2.5">
                  {p.done ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-label="Tamamlandı" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-slate-300" aria-label="Bekliyor" />
                  )}
                  <span className={p.done ? 'text-slate-900' : 'text-slate-500'}>
                    Faz {p.no} — {p.title}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
