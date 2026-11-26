import { Controller, Get, Header } from '@nestjs/common';
import { PublicSiteService } from './public-site.service';

/** Herkese açık site verisi (giriş gerektirmez; sadece yayınlanabilir alanlar döner). */
@Controller('public/site')
export class PublicSiteController {
  constructor(private readonly site: PublicSiteService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60')
  get() {
    return this.site.getPublicSite();
  }
}
