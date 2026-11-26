import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sayfa bulunamadı</h1>
      <p className="mt-2 text-slate-500">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
      <ButtonLink href="/" className="mt-6">
        Ana sayfaya dön
      </ButtonLink>
    </section>
  );
}
