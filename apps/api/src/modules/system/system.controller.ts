import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly system: SystemService) {}

  /**
   * Sağlık kontrolü. Uptime izleme ve Docker healthcheck bu uç noktayı kullanır.
   * Veritabanına ulaşılamazsa 503 döner.
   * Not: Faz 2'de ayrıntılı alanlar (sürüm, migration) `system.view` yetkisine bağlanacak.
   */
  @Get('health')
  async health(@Res({ passthrough: true }) res: Response) {
    const result = await this.system.health();
    if (result.status !== 'ok') res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
