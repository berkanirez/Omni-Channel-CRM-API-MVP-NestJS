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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('customers/:customerId/contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Permissions('contact:create')
  @Post()
  create(
    @Param('customerId') customerId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contacts.create(customerId, dto);
  }

  @Permissions('contact:read')
  @Get()
  list(
    @Param('customerId') customerId: string,
    @Query() query: ListContactsQueryDto,
  ) {
    return this.contacts.list(customerId, query);
  }

  @Permissions('contact:read')
  @Get(':id')
  getById(@Param('customerId') customerId: string, @Param('id') id: string) {
    return this.contacts.getById(customerId, id);
  }

  @Permissions('contact:update')
  @Patch(':id')
  update(
    @Param('customerId') customerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contacts.update(customerId, id, dto);
  }

  @Permissions('contact:delete')
  @Delete(':id')
  softDelete(@Param('customerId') customerId: string, @Param('id') id: string) {
    return this.contacts.softDelete(customerId, id);
  }
}
