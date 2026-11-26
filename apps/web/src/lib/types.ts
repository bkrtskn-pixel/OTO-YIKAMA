// API yanıt tipleri (Faz 2'de paylaşılan Zod şemalarına taşınacak)

export interface DayHours {
  open: string;
  close: string;
}

export type WorkingHours = Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', DayHours | null>>;

export interface PublicSite {
  businessName: string;
  slogan: string | null;
  primaryColor: string;
  phone: string | null;
  whatsappPhone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  map: { lat: number; lng: number } | null;
  workingHours: WorkingHours;
  socialLinks: Record<string, string>;
}

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
