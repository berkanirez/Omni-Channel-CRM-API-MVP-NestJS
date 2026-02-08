import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestContextService } from '../logger/request-context.service';
import { TenantResolverService } from '../tenant/tenant-resolver.service';

type AuthedUser = { userId: string; companyId?: string };

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly requestContext: RequestContextService,
    private readonly tenantResolver: TenantResolverService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();

    const authedUser = req.user as AuthedUser | undefined;

    if (!authedUser?.userId) {
      throw new UnauthorizedException('Giriş yapmalısın.');
    }

    const rawHeader = req.headers['x-company-id'];
    const headerCompanyId =
      typeof rawHeader === 'string'
        ? rawHeader
        : Array.isArray(rawHeader)
          ? rawHeader[0]
          : undefined;

    const resolvedCompanyId = await this.tenantResolver.resolveCompanyId({
      userId: authedUser.userId,
      tokenCompanyId: authedUser.companyId,
      headerCompanyId,
    });

    this.requestContext.set({
      userId: authedUser.userId,
      companyId: resolvedCompanyId,
    });

    req.companyId = resolvedCompanyId;

    return true;
  }
}
