import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestContextService } from '../logger/request-context.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly ctx: RequestContextService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const userId = this.ctx.getUserId();
    const companyId = this.ctx.getCompanyId();

    if (!userId) throw new UnauthorizedException('Giriş yapmalısın.');
    if (!companyId)
      throw new UnauthorizedException('Tenant (company) çözülemedi.');

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { companyId, isActive: true },
      },
      select: {
        role: {
          select: {
            rolePermissions: {
              select: { permission: { select: { key: true } } },
            },
          },
        },
      },
    });

    const userPermSet = new Set<string>();

    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        userPermSet.add(rp.permission.key);
      }
    }

    const missing = required.filter((p) => !userPermSet.has(p));

    if (missing.length > 0) {
      throw new ForbiddenException(
        `İzin yok. Eksik izinler: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
