import { z } from 'zod';

/** Ortam değişkenleri uygulama açılışında doğrulanır; eksik/hatalı ise uygulama başlamaz. */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  APP_ENCRYPTION_KEY: z.string().optional(),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  SENTRY_DSN: z.string().optional(),
  APP_VERSION: z.string().default('0.1.0'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Ortam değişkenleri geçersiz:\n${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    const key = env.APP_ENCRYPTION_KEY ? Buffer.from(env.APP_ENCRYPTION_KEY, 'base64') : null;
    if (!key || key.length !== 32) {
      throw new Error('Production ortamında APP_ENCRYPTION_KEY 32 baytlık base64 değer olmalıdır.');
    }
  }
  return env;
}
