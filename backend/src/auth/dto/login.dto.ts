import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  /** Email address or school username */
  @IsString()
  @MinLength(1)
  identifier: string;

  @IsString()
  @MinLength(8)
  password: string;
}
