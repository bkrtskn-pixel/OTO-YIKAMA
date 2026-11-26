import { Clock, MapPin, Phone } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { getPublicSite, whatsappLink, workingHoursRows } from '@/lib/site';

/**
 * Ana sayfa iskeleti. Hizmetler, fiyatlar, kampanyalar, SSS, yorumlar ve
 * KVKK sayfaları Faz 15'te panelden yönetilebilir içerikle eklenecek.
 */
export default async function HomePage() {
  const site = await getPublicSite();

  if (!site.ok) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Site geçici olarak kullanılamıyor</h1>
        <p className="mt-3 text-slate-500">Lütfen kısa bir süre sonra tekrar deneyin.</p>
      </section>
    );
  }

  const s = site.data;
  const wa = whatsappLink(s.whatsappPhone);
  const hours = workingHoursRows(s.workingHours);

  return (
    <>
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(60rem 30rem at 85% -10%, var(--brand), transparent 60%), radial-gradient(40rem 20rem at -10% 110%, var(--brand), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {s.businessName}
          </h1>
          {s.slogan && <p className="mt-4 max-w-xl text-lg text-slate-300">{s.slogan}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {wa && (
              <ButtonLink href={wa} variant="whatsapp" size="lg">
                WhatsApp ile yazın
              </ButtonLink>
            )}
            {s.phone && (
              <ButtonLink
                href={`tel:${s.phone.replace(/\s/g, '')}`}
                variant="secondary"
                size="lg"
                className="bg-white/10 text-white ring-white/20 hover:bg-white/20"
              >
                <Phone className="size-5" aria-hidden /> Hemen arayın
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Clock className="size-5 text-brand" aria-hidden /> Çalışma saatleri
          </h2>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            {hours.map((h) => (
              <div key={h.label} className="flex justify-between py-2.5">
                <dt className="text-slate-600">{h.label}</dt>
                <dd className={h.value === 'Kapalı' ? 'text-slate-400' : 'font-medium text-slate-900'}>
                  {h.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <MapPin className="size-5 text-brand" aria-hidden /> İletişim
          </h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            {s.address && (
              <div>
                <dt className="text-slate-500">Adres</dt>
                <dd className="font-medium text-slate-900">
                  {s.address}
                  {s.city && `, ${s.city}`}
                </dd>
              </div>
            )}
            {s.phone && (
              <div>
                <dt className="text-slate-500">Telefon</dt>
                <dd className="font-medium text-slate-900">{s.phone}</dd>
              </div>
            )}
            {s.email && (
              <div>
                <dt className="text-slate-500">E-posta</dt>
                <dd className="font-medium text-slate-900">{s.email}</dd>
              </div>
            )}
            {!s.address && !s.phone && !s.email && (
              <p className="text-slate-500">İletişim bilgileri yakında eklenecek.</p>
            )}
          </dl>
        </div>
      </section>
    </>
  );
}
