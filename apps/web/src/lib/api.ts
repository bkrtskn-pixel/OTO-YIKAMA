import 'server-only';

/**
 * Sunucu tarafı (SSR / Server Component) API istemcisi.
 * Tarayıcı tarafı istekler aynı origin üzerinden /api/v1/... adresine gider.
 */
const API_BASE = `${process.env.API_INTERNAL_URL ?? 'http://localhost:4000'}/api/v1`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export async function apiGet<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
    const body = (await res.json().catch(() => null)) as
      | (T & { error?: { code: string; message: string } })
      | null;
    if (!res.ok) {
      return {
        ok: false,
        error: new ApiError(
          res.status,
          body?.error?.code ?? 'HTTP_ERROR',
          body?.error?.message ?? `Sunucu hatası (${res.status})`,
        ),
      };
    }
    return { ok: true, data: body as T };
  } catch {
    return {
      ok: false,
      error: new ApiError(0, 'API_UNREACHABLE', 'API sunucusuna ulaşılamıyor.'),
    };
  }
}
