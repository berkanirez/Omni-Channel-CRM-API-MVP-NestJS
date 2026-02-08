import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveCompanyId(args: {
    userId: string;
    tokenCompanyId?: string;
    headerCompanyId?: string;
  }) {
    const candidate = args.headerCompanyId ?? args.tokenCompanyId;

    if (!candidate) {
      throw new BadRequestException(
        'companyId çözülemedi. Token veya x-company-id gerekli.',
      );
    }

    const membership = await this.prisma.userCompany.findFirst({
      where: {
        userId: args.userId,
        companyId: candidate,
        isActive: true,
        company: { isActive: true },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('Bu şirkete erişim yetkin yok.');
    }

    return candidate;
  }
}
