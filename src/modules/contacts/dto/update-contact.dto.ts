import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 30)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
