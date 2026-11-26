import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppError, type ErrorBody } from './app-error';

const DEFAULT_MESSAGES: Record<number, { code: string; message: string }> = {
  400: { code: 'BAD_REQUEST', message: 'İstek geçersiz.' },
  401: { code: 'UNAUTHENTICATED', message: 'Oturum açmanız gerekiyor.' },
  403: { code: 'FORBIDDEN', message: 'Bu işlem için yetkiniz yok.' },
  404: { code: 'NOT_FOUND', message: 'Kayıt bulunamadı.' },
  409: { code: 'CONFLICT', message: 'Kayıt başka bir işlemle değişti. Sayfayı yenileyin.' },
  429: { code: 'RATE_LIMITED', message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.' },
};

/** Tüm hataları tek biçime çevirir: { error: { code, message, details } } */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      error: { code: 'INTERNAL_ERROR', message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.' },
    };

    if (exception instanceof AppError) {
      status = exception.getStatus();
      body = { error: { code: exception.code, message: exception.message, details: exception.details } };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const fallback = DEFAULT_MESSAGES[status] ?? { code: 'HTTP_ERROR', message: exception.message };
      body = { error: { ...fallback } };
    } else {
      // Beklenmeyen hata: detay kullanıcıya gösterilmez, loglanır.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json(body);
  }
}
