import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env';
import { PrismaModule } from './infra/prisma/prisma.module';
import { SystemModule } from './modules/system/system.module';
import { WebsiteModule } from './modules/website/website.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv, cache: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } }
            : undefined,
        // Kişisel veri ve oturum bilgisi loglara yazılmaz (docs/04 G-19)
        redact: {
          paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
          censor: '[gizli]',
        },
        autoLogging: { ignore: (req) => req.url === '/api/v1/system/health' },
      },
    }),
    PrismaModule,
    SystemModule,
    WebsiteModule,
  ],
})
export class AppModule {}
