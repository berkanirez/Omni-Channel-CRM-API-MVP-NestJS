import { IsUUID } from 'class-validator';

export class UuidParamDto {
  @IsUUID()
  id!: string;
}
