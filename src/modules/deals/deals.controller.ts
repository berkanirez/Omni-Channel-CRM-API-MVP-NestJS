import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-deal-stage.dto';
import { ListDealsQueryDto } from './dto/list-deals.dto';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Permissions('deal:create')
  @Post()
  create(@Body() dto: CreateDealDto) {
    return this.deals.create(dto);
  }

  @Permissions('deal:read')
  @Get()
  list(@Query() query: ListDealsQueryDto) {
    return this.deals.list(query);
  }

  @Permissions('deal:read')
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.deals.getById(id);
  }

  @Permissions('deal:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.deals.update(id, dto);
  }

  @Permissions('deal:update')
  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body() dto: UpdateDealStageDto) {
    return this.deals.updateStage(id, dto.stage);
  }

  @Permissions('deal:delete')
  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.deals.softDelete(id);
  }
}
