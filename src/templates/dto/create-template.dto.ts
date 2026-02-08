import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CommunicationChannel } from 'src/communications/dto/test-send.dto';

export class CreateTemplateDto {
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @IsString()
  @MaxLength(80)
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  subject?: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  variablesSchema?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
