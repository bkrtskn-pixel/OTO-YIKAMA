import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface PublicSiteDto {
  businessName: string;
  slogan: string | null;
  primaryColor: string;
  phone: string | null;
  whatsappPhone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  map: { lat: number; lng: number } | null;
  workingHours: unknown;
  socialLinks: unknown;
}

@Injectable()
export class PublicSiteService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSite(): Promise<PublicSiteDto> {
    const s = await this.prisma.businessSettings.findUnique({ where: { id: 1 } });
    if (!s) {
      throw new AppError(
        'SITE_NOT_CONFIGURED',
        'İşletme ayarları henüz oluşturulmamış. Kurulum adımlarını tamamlayın (pnpm db:seed).',
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      businessName: s.businessName,
      slogan: s.slogan,
      primaryColor: s.primaryColor,
      phone: s.phone,
      whatsappPhone: s.whatsappPhone,
      email: s.email,
      address: s.address,
      city: s.city,
      map: s.mapLat != null && s.mapLng != null ? { lat: s.mapLat, lng: s.mapLng } : null,
      workingHours: s.workingHours,
      socialLinks: s.socialLinks,
    };
  }
}
