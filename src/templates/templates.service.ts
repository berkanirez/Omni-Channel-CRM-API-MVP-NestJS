import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestContextService } from 'src/common/logger/request-context.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  async create(dto: CreateTemplateDto) {
    const { companyId } = this.ctx.get();
    return await this.prisma.communicationTemplate.create({
      data: {
        companyId: companyId!,
        channel: dto.channel as any,
        key: dto.key,
        subject: dto.subject ?? null,
        body: dto.body,
        variablesSchema: dto.variablesSchema ?? undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async list() {
    const { companyId } = this.ctx.get();
    return await this.prisma.communicationTemplate.findMany({
      where: { companyId: companyId!, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string) {
    const { companyId } = this.ctx.get();
    const t = await this.prisma.communicationTemplate.findFirst({
      where: { id, companyId: companyId!, deletedAt: null },
    });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.getById(id);
    const { companyId } = this.ctx.get();

    return this.prisma.communicationTemplate.update({
      where: { id },
      data: {
        channel: dto.channel ? (dto.channel as any) : undefined,
        key: dto.key ?? undefined,
        subject: dto.subject ?? undefined,
        body: dto.body ?? undefined,
        variablesSchema: dto.variablesSchema ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async softDelete(id: string) {
    await this.getById(id);
    return this.prisma.communicationTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async getByKey(channel: string, key: string) {
    const { companyId } = this.ctx.get();
    const t = await this.prisma.communicationTemplate.findFirst({
      where: {
        companyId: companyId!,
        channel: channel as any,
        key,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }
}
