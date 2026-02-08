import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SendDto } from './dto/send.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { MessageService } from './message.service';

@ApiTags('communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly message: MessageService) {}

  @Permissions('communication:send')
  @Post('send')
  send(@Body() dto: SendDto) {
    return this.message.sendManual(dto);
  }

  @Permissions('communication:read')
  @Get()
  list() {
    return this.message.list();
  }

  @Permissions('communication:read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.message.getById(id);
  }
}
