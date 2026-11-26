import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Uygulama hatası. `code` makine için (arayüz buna göre davranır),
 * `message` kullanıcıya gösterilecek Türkçe açıklama.
 */
export class AppError extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}
