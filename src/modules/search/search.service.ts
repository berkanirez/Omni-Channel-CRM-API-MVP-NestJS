import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from 'src/common/logger/request-context.service';
import { SearchQueryDto } from './dto/search-query.dto';

type SearchType = 'customers' | 'deals' | 'contacts';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  private requireCompanyId() {
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Tenant çözülemedi.');
    return companyId;
  }

  private parseTypes(raw?: string): SearchType[] {
    const all: SearchType[] = ['customers', 'deals', 'contacts'];
    if (!raw) return all;

    const parts = raw
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean) as SearchType[];

    const invalid = parts.filter((p) => !all.includes(p));
    if (invalid.length) {
      throw new BadRequestException(`Geçersiz types: ${invalid.join(', ')}`);
    }

    return Array.from(new Set(parts));
  }

  async searchAll(query: SearchQueryDto) {
    const companyId = this.requireCompanyId();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const q = query.q.trim();
    if (!q) throw new BadRequestException('q zorunludur.');

    const types = this.parseTypes(query.types);

    const result: any = {};

    if (types.includes('customers')) {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.customer.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { taxNumber: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            type: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.customer.count({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { taxNumber: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

      result.customers = {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }

    if (types.includes('deals')) {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.deal.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { currency: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
            currency: true,
            createdAt: true,
            customerId: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.deal.count({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { currency: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

      result.deals = {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }

    if (types.includes('contacts')) {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.contact.findMany({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            customerId: true,
            isPrimary: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.contact.count({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ]);

      result.contacts = {
        items,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    }

    return result;
  }
}
