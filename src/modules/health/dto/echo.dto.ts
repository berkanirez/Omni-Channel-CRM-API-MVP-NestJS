import { IsString, MinLength } from 'class-validator';

export class EchoDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
