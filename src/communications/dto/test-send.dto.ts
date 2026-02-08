import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
} from 'class-validator';

export enum CommunicationChannel {
  email = 'email',
  sms = 'sms',
  push = 'push',
}

export class TestSendDto {
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @IsString()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsString()
  templateKey?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}
