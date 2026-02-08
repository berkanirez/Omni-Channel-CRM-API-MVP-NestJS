import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from 'src/common/logger/request-context.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts.dto';
import { AuditService } from 'src/common/audit/audit.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
    private readonly audit: AuditService,
  ) {}

  private async ensureCustomer(customerId: string) {
    const companyId = this.ctx.getCompanyId();
    if (!companyId) throw new BadRequestException('Tenant çözülemedi.');

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, deletedAt: null },
      select: { id: true, companyId: true, name: true },
    });

    if (!customer) throw new NotFoundException('Customer bulunamadı.');
    return customer;
  }

  async create(customerId: string, dto: CreateContactDto) {
    const customer = await this.ensureCustomer(customerId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary === true) {
        await tx.contact.updateMany({
          where: { customerId: customer.id, deletedAt: null },
          data: { isPrimary: false },
        });
      }

      const data = {
        companyId: customer.companyId,
        customerId: customer.id,
        firstName: dto.firstName,
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
      };

      const created = await tx.contact.create({ data });

      let finalContact = created;

      if (dto.isPrimary !== true) {
        const hasPrimary = await tx.contact.findFirst({
          where: { customerId: customer.id, deletedAt: null, isPrimary: true },
          select: { id: true },
        });

        if (!hasPrimary) {
          const updatedPrimary = await tx.contact.update({
            where: { id: created.id },
            data: { isPrimary: true },
          });

          finalContact = updatedPrimary;
        }
      }

      await this.audit.log(
        {
          action: 'contact:create',
          entity: 'Contact',
          entityId: finalContact.id,
          metadata: {
            customerId: customer.id,
            isPrimary: finalContact.isPrimary,
          },
        },
        tx,
      );

      return finalContact;
    });
  }

  async list(customerId: string, query: ListContactsQueryDto) {
    const customer = await this.ensureCustomer(customerId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const q = query.q?.trim();

    const where: any = {
      companyId: customer.companyId,
      customerId: customer.id,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(customerId: string, id: string) {
    const customer = await this.ensureCustomer(customerId);

    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        customerId: customer.id,
        companyId: customer.companyId,
        deletedAt: null,
      },
    });

    if (!contact) throw new NotFoundException('Contact bulunamadı.');
    return contact;
  }

  async update(customerId: string, id: string, dto: UpdateContactDto) {
    const customer = await this.ensureCustomer(customerId);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.contact.findFirst({
        where: {
          id,
          customerId: customer.id,
          companyId: customer.companyId,
          deletedAt: null,
        },
        select: { id: true, isPrimary: true },
      });

      if (!existing) throw new NotFoundException('Contact bulunamadı.');

      if (dto.isPrimary === true) {
        await tx.contact.updateMany({
          where: { customerId: customer.id, deletedAt: null },
          data: { isPrimary: false },
        });
      }

      const data = {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
      };

      const updated = await tx.contact.update({
        where: { id: existing.id },
        data,
      });

      await this.audit.log(
        {
          action: 'contact:update',
          entity: 'Contact',
          entityId: existing.id,
          metadata: {
            customerId: customer.id,
            changedFields: Object.keys(data),
          },
        },
        tx,
      );

      return updated;
    });
  }

  async softDelete(customerId: string, id: string) {
    const customer = await this.ensureCustomer(customerId);

    return this.prisma.$transaction(async (tx) => {
      const contact = await tx.contact.findFirst({
        where: {
          id,
          customerId: customer.id,
          companyId: customer.companyId,
          deletedAt: null,
        },
        select: { id: true, isPrimary: true },
      });

      if (!contact) throw new NotFoundException('Contact bulunamadı.');

      await tx.contact.update({
        where: { id: contact.id },
        data: { deletedAt: new Date(), isPrimary: false },
      });

      let promotedToPrimaryId: string | null = null;

      if (contact.isPrimary) {
        const next = await tx.contact.findFirst({
          where: { customerId: customer.id, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });

        if (next) {
          await tx.contact.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
          promotedToPrimaryId = next.id;
        }
      }

      await this.audit.log(
        {
          action: 'contact:delete',
          entity: 'Contact',
          entityId: contact.id,
          metadata: {
            customerId: customer.id,
            wasPrimary: contact.isPrimary,
            promotedToPrimaryId,
          },
        },
        tx,
      );

      return { deleted: true };
    });
  }
}
