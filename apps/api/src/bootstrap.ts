import { type INestApplication, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/errors/http-exception.filter';

/** main.ts ve testlerin aynı yapılandırmayı kullanması için ortak kurulum. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(helmet());
  // Nginx arkasında gerçek istemci IP'si (rate limit ve audit log için)
  const instance = app.getHttpAdapter().getInstance() as { set?: (k: string, v: unknown) => void };
  instance.set?.('trust proxy', 1);
  app.enableShutdownHooks();
}
