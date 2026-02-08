import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDealDto {
  @IsString()
  customerId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
