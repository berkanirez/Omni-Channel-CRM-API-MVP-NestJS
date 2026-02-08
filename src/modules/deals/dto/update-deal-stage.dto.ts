import { DealStage } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateDealStageDto {
  @IsEnum(DealStage)
  stage: DealStage;
}
