import { AlertTriangle } from 'lucide-react';
import type { ApiError } from '@/lib/api';

export function ApiErrorState({ error }: { error: ApiError }) {
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{error.message}</p>
        <p className="mt-1 text-rose-700/80">
          Hata kodu: <code className="font-mono">{error.code}</code>
          {error.status > 0 && ` · HTTP ${error.status}`}
        </p>
      </div>
    </div>
  );
}
