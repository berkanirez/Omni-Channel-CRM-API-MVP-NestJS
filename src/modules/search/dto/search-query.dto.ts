import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

const TYPES = ['customers', 'deals', 'contacts'] as const;
type SearchType = (typeof TYPES)[number];

export class SearchQueryDto {
  @IsString()
  @MaxLength(100)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  types?: string;
}
