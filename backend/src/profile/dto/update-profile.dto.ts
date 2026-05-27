import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  avatarUrl?: string;

  /** Students: grade must match school configuration when set. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;
}
