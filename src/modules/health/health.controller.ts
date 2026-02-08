import { Controller, Get, UseGuards, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { EchoDto } from './dto/echo.dto';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';
import { RequestContextService } from '../../common/logger/request-context.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('health')
export class HealthController {
  constructor(private readonly requestContext: RequestContextService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'omni-channel-crm-api',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiHeader({
    name: 'x-company-id',
    required: false,
    description:
      'Tenant override için companyId (UUID). Üyelik kontrolü yapılır.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @Get('me')
  me(@CurrentUser() user: { userId: string; companyId: string }) {
    return {
      message: 'Authenticated',
      user,
      resolvedCompanyId: this.requestContext.getCompanyId(),
      requestId: this.requestContext.getRequestId(),
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('echo')
  echo(@Body() dto: EchoDto) {
    return dto;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
  @Permissions('audit:read')
  @Get('audit-probe')
  auditProbe() {
    return { ok: true, message: 'You have audit:read permission' };
  }
}
