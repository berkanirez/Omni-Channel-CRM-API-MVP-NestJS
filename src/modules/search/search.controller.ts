import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { TenantContextGuard } from 'src/common/guards/tenant-context.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Permissions('search:read')
  @Get()
  searchAll(@Query() query: SearchQueryDto) {
    if (!query.q || query.q.trim().length === 0) {
      throw new BadRequestException('q zorunludur.');
    }
    return this.search.searchAll(query);
  }
}
